/**
         * 1. CONFIGURAÇÃO PWA (MANIFEST DINÂMICO, SERVICE WORKER EMBUTIDO E INSTALL PROMPT)
         */
        let deferredInstallPrompt = null;

        function initPWA() {
            document.getElementById('btn-check-updates').addEventListener('click', () => checkForAppUpdates({manual: true}));
            if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
                navigator.serviceWorker.register('./service-worker.js', { scope: './' })
                    .then(registration => initUpdateManager(registration))
                    .catch(error => console.warn('PWA: instalação do service worker indisponível:', error));
            }
            const installBtn = document.getElementById('btn-install-pwa');
            window.addEventListener('beforeinstallprompt', (event) => {
                event.preventDefault();
                deferredInstallPrompt = event;
                installBtn.classList.remove('hidden');
                installBtn.classList.add('inline-flex');
            });
            installBtn.addEventListener('click', async () => {
                if (!deferredInstallPrompt) return;
                await deferredInstallPrompt.prompt();
                const choice = await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                if (choice.outcome === 'accepted') {
                    installBtn.classList.add('hidden');
                    showToast('Instalação solicitada com sucesso.');
                }
            });
            window.addEventListener('appinstalled', () => {
                installBtn.classList.add('hidden');
                deferredInstallPrompt = null;
            });
        }

        /**
         * Atualizações PWA: somente versões publicadas no mesmo host, com confirmação.
         * A verificação não acessa nem altera IndexedDB/localStorage de vistorias.
         */
        const APP_VERSION = '1.4.2';
        let updateRegistration = null;
        let availableUpdateVersion = null;
        let updateCheckInProgress = false;
        let applyingUpdate = false;
        let updateCheckTimestamp = 0;

        function isNewerVersion(candidate, installed = APP_VERSION) {
            const parse = input => /^\d+\.\d+\.\d+$/.test(String(input))
                ? String(input).split('.').map(Number) : null;
            const a = parse(candidate), b = parse(installed);
            if (!a || !b) return false;
            for (let i = 0; i < 3; i++) {
                if (a[i] !== b[i]) return a[i] > b[i];
            }
            return false;
        }

        function setUpdateSettingsMessage(message) {
            const status = document.getElementById('app-update-settings-status');
            if (status) status.textContent = message;
        }

        function showAvailableUpdate(version) {
            if (!isNewerVersion(version)) return;
            availableUpdateVersion = version;
            const notice = document.getElementById('app-update-notice');
            document.getElementById('app-update-description').textContent = `Versão ${version} disponível. Suas vistorias permanecem salvas.`;
            notice.hidden = false;
            setUpdateSettingsMessage(`Nova versão ${version} disponível. Clique em Atualizar.`);
        }

        async function checkForAppUpdates({manual = false} = {}) {
            if (updateCheckInProgress) return;
            if (!navigator.onLine) {
                if (manual) setUpdateSettingsMessage('Sem conexão. Verifique novamente quando estiver online.');
                return;
            }
            if (!(location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
                if (manual) setUpdateSettingsMessage('Atualização automática disponível na versão hospedada (HTTPS).');
                return;
            }
            updateCheckInProgress = true;
            if (manual) setUpdateSettingsMessage('Procurando versões publicadas...');
            try {
                // Cache-buster também contorna service workers antigos que guardavam JSONs.
                const path = new URL('./version.json', location.href);
                path.searchParams.set('check', String(Date.now()));
                const response = await fetch(path, {cache: 'no-store'});
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const metadata = await response.json();
                const latest = metadata && metadata.version;
                if (!/^\d+\.\d+\.\d+$/.test(String(latest))) throw new Error('Manifesto de versão inválido');
                if (isNewerVersion(latest)) {
                    showAvailableUpdate(latest);
                    // Instala a versão em espera, mas NÃO ativa sem ação do usuário.
                    if (updateRegistration) await updateRegistration.update();
                } else if (manual) {
                    setUpdateSettingsMessage(`Versão ${APP_VERSION} atualizada.`);
                    showToast('Você já está usando a versão mais recente.');
                }
                updateCheckTimestamp = Date.now();
            } catch (error) {
                if (manual) setUpdateSettingsMessage('Não foi possível verificar. Confira sua conexão e tente novamente.');
                console.warn('Verificação de atualização indisponível:', error);
            } finally {
                updateCheckInProgress = false;
            }
        }

        async function applyAppUpdate() {
            if (applyingUpdate || !availableUpdateVersion || !updateRegistration) return;
            const btn = document.getElementById('btn-apply-update');
            applyingUpdate = true;
            btn.disabled = true;
            btn.textContent = 'Preparando...';
            try {
                // Evita trocar de versão com uma operação de salvamento ainda pendente.
                await flushSave();
                await saveInFlight;
                if (document.getElementById('save-status-text').textContent.includes('Falha')) {
                    throw new Error('Falha ao salvar a vistoria atual');
                }
                await updateRegistration.update();
                let worker = updateRegistration.waiting;
                if (!worker && updateRegistration.installing) {
                    const installing = updateRegistration.installing;
                    await new Promise((resolve, reject) => {
                        if (installing.state === 'installed') return resolve();
                        const listener = () => {
                            if (installing.state === 'installed') { installing.removeEventListener('statechange', listener); resolve(); }
                            else if (installing.state === 'redundant') { installing.removeEventListener('statechange', listener); reject(new Error('Falha ao preparar versão')); }
                        };
                        installing.addEventListener('statechange', listener);
                    });
                    worker = updateRegistration.waiting;
                }
                if (!worker) throw new Error('Versão ainda não pronta para instalação');
                let switched = false;
                const onControllerChange = () => {
                    if (switched) return;
                    switched = true;
                    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
                    // URL única: impede que a navegação reutilize um HTML anterior.
                    const next = new URL('./index.html', location.href);
                    next.searchParams.set('v', availableUpdateVersion);
                    location.replace(next.href);
                };
                navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
                worker.postMessage({type: 'SKIP_WAITING'});
                setUpdateSettingsMessage('Instalando a atualização...');
                // Sem reload forçado: só recarrega após confirmação do novo SW ativo.
            } catch (error) {
                console.warn('Não foi possível aplicar a atualização:', error);
                setUpdateSettingsMessage('Atualização não concluída. Tente novamente com internet.');
                showToast('Atualização não concluída. Suas vistorias foram mantidas.');
                btn.disabled = false;
                btn.textContent = 'Atualizar';
                applyingUpdate = false;
            }
        }

        function initUpdateManager(registration) {
            updateRegistration = registration;
            document.getElementById('btn-apply-update').addEventListener('click', applyAppUpdate);
            document.getElementById('btn-dismiss-update').addEventListener('click', () => {
                document.getElementById('app-update-notice').hidden = true;
            });
            // O navegador pode instalar o novo worker em segundo plano; nunca ativa sozinho.
            registration.addEventListener('updatefound', () => {
                const installing = registration.installing;
                installing?.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller && availableUpdateVersion) {
                        showAvailableUpdate(availableUpdateVersion);
                    }
                });
            });
            checkForAppUpdates();
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && Date.now() - updateCheckTimestamp > 5 * 60_000) checkForAppUpdates();
            });
            window.addEventListener('online', () => checkForAppUpdates());
            setInterval(() => {
                if (document.visibilityState === 'visible') checkForAppUpdates();
            }, 15 * 60_000);
        }

                /**
         * 2. SCHEMA DAS 6 SEÇÕES DE CHECKLIST
         */
        const CHECKLIST_SCHEMA = [
            {
                id: 'doc_obrigatorios',
                title: '1. Documentação e Itens Obrigatórios',
                subtitle: 'CRLV, CNH, estepe, macaco, triângulo e cintos',
                icon: 'ph-shield-check',
                accentColor: '#4f46e5',
                bgColor: '#eef2ff',
                borderColor: '#c7d2fe',
                items: [
                    'CRLV (Documento do Veículo)',
                    'CNH do Condutor Regular',
                    'Triângulo de Sinalização',
                    'Macaco',
                    'Chave de Roda',
                    'Pneu Estepe (Estado e Calibragem)',
                    'Extintor de Incêndio (se aplicável)',
                    'Cintos de Segurança (Todos)'
                ]
            },
            {
                id: 'exterior_lataria',
                title: '2. Exterior, Lataria e Vidros',
                subtitle: 'Para-choques, portas, retrovisores, para-brisa e palhetas',
                icon: 'ph-car-simple',
                accentColor: '#0284c7',
                bgColor: '#f0f9ff',
                borderColor: '#bae6fd',
                items: [
                    'Para-choque Dianteiro',
                    'Para-choque Traseiro',
                    'Capô',
                    'Teto',
                    'Tampa do Porta-malas / Caçamba',
                    'Portas Lado Esquerdo',
                    'Portas Lado Direito',
                    'Retrovisores (Externos e Interno)',
                    'Para-brisa Dianteiro',
                    'Vidros Laterais e Traseiro',
                    'Palhetas / Limpadores de Para-brisa'
                ]
            },
            {
                id: 'pneus_rodas',
                title: '3. Pneus, Rodas e Suspensão',
                subtitle: 'Sulcos dos pneus, rodas/calotas e estabilidade visual',
                icon: 'ph-tire',
                accentColor: '#0d9488',
                bgColor: '#f0fdfa',
                borderColor: '#99f6e4',
                items: [
                    'Pneu Dianteiro Esquerdo (Sulcos/Desgaste)',
                    'Pneu Dianteiro Direito (Sulcos/Desgaste)',
                    'Pneu Traseiro Esquerdo (Sulcos/Desgaste)',
                    'Pneu Traseiro Direito (Sulcos/Desgaste)',
                    'Rodas / Calotas e Parafusos',
                    'Alinhamento / Suspensão Visual'
                ]
            },
            {
                id: 'iluminacao',
                title: '4. Iluminação e Sinalização',
                subtitle: 'Faróis, lanternas, setas, luzes de freio, ré e placa',
                icon: 'ph-lightbulb',
                accentColor: '#d97706',
                bgColor: '#fffbeb',
                borderColor: '#fde68a',
                items: [
                    'Faróis (Baixo e Alto)',
                    'Faróis de Neblina / Milha',
                    'Lanternas Dianteiras e Traseiras',
                    'Luzes de Freio (incluindo Brake-light)',
                    'Setas e Pisca-alerta',
                    'Luz de Ré',
                    'Luz de Placa'
                ]
            },
            {
                id: 'interior_painel',
                title: '5. Interior, Painel e Conforto',
                subtitle: 'Painel, ar-condicionado, buzina, vidros, travas e bancos',
                icon: 'ph-steering-wheel',
                accentColor: '#7c3aed',
                bgColor: '#f5f3ff',
                borderColor: '#ddd6fe',
                items: [
                    'Painel de Instrumentos (Sem luzes de alerta)',
                    'Ar-condicionado / Ventilação',
                    'Buzina',
                    'Vidros Elétricos',
                    'Travas Elétricas e Chave/Alarme',
                    'Estofamento e Bancos',
                    'Tapetes e Forração Interna',
                    'Sistema de Som / Multimídia'
                ]
            },
            {
                id: 'motor_fluidos',
                title: '6. Motor, Fluidos e Mecânica',
                subtitle: 'Óleo, radiador, fluido de freio, bateria e vazamentos',
                icon: 'ph-engine',
                accentColor: '#e11d48',
                bgColor: '#fff1f2',
                borderColor: '#fecdd3',
                items: [
                    'Nível de Óleo do Motor',
                    'Água do Radiador / Líquido Arrefecimento',
                    'Nível do Fluido de Freio',
                    'Água do Limpador de Para-brisa',
                    'Bateria e Terminais',
                    'Correias e Mangueiras Visíveis',
                    'Ausência de Vazamentos Sob o Veículo'
                ]
            }
        ];

        const STORAGE_KEY = 'vistoria_veicular_pwa_v3';
        const LEGACY_STORAGE_KEY = 'vistoria_veicular_pwa_v2';
        const HISTORY_STORAGE_KEY = 'vistoria_veicular_history_v1';

        function generateProtocolId() {
            const now = new Date();
            const yr = now.getFullYear().toString().slice(-2);
            const rnd = globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] % 90000 + 10000 : Math.floor(10000 + Math.random() * 90000);
            return `VST-${yr}${String(now.getTime()).slice(-7)}-${rnd}`;
        }

        function generateHistoryEntryId() {
            const unique = globalThis.crypto?.randomUUID?.();
            return unique ? `HST-${unique}` : `HST-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
        }

        function todayLocal() {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        function safeText(value) {
            return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        }

        function validPhoto(value) {
            return typeof value === 'string' && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 6500000 ? value : null;
        }

        function normalizeState(raw) {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !raw.vehicle || typeof raw.vehicle !== 'object') throw new Error('Arquivo sem dados de vistoria');
            const next = createDefaultState();
            const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
            next.meta.id = typeof meta.id === 'string' && /^[A-Za-z0-9-]{1,60}$/.test(meta.id) ? meta.id : next.meta.id;
            next.meta.updatedAt = typeof meta.updatedAt === 'string' ? meta.updatedAt : next.meta.updatedAt;
            const g = meta.gps;
            if (g && Number.isFinite(g.lat) && Number.isFinite(g.lng) && Math.abs(g.lat) <= 90 && Math.abs(g.lng) <= 180) next.meta.gps = { lat: g.lat, lng: g.lng };
            if (meta.savedAt && typeof meta.savedAt === 'string') next.meta.savedAt = meta.savedAt;
            if (typeof meta.archiveId === 'string' && /^[A-Za-z0-9-]{1,80}$/.test(meta.archiveId)) next.meta.archiveId = meta.archiveId;
            for (const key of Object.keys(next.vehicle)) {
                if (typeof raw.vehicle[key] === 'string') next.vehicle[key] = raw.vehicle[key].slice(0, key === 'obsGerais' ? 8000 : 300);
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(next.vehicle.data)) next.vehicle.data = todayLocal();
            if (!['Entrada', 'Saída', 'Periódica', 'Transferência'].includes(next.vehicle.tipo)) next.vehicle.tipo = 'Entrada';
            if (!['Reserva', '1/4', '1/2', '3/4', 'Cheio'].includes(next.vehicle.combustivel)) next.vehicle.combustivel = '1/2';
            for (const s of CHECKLIST_SCHEMA) for (let i = 0; i < s.items.length; i++) {
                const k = `${s.id}_${i}`;
                const e = raw.checklist && typeof raw.checklist === 'object' ? raw.checklist[k] : null;
                next.checklist[k] = {
                    status: ['ok', 'nok', 'na'].includes(e?.status) ? e.status : null,
                    obs: typeof e?.obs === 'string' ? e.obs.slice(0, 3000) : '',
                    photo: validPhoto(e?.photo)
                };
            }
            if (Array.isArray(raw.pins)) {
                next.pins = raw.pins.slice(0, 300).filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)).map((p, i) => ({
                    id: Number.isSafeInteger(p.id) ? p.id : Date.now() + i,
                    x: Math.max(4, Math.min(96, p.x)), y: Math.max(6, Math.min(94, p.y)),
                    type: ['Amassado','Risco','Quebrado','Faltando'].includes(p.type) ? p.type : 'Risco',
                    desc: typeof p.desc === 'string' ? p.desc.slice(0, 2000) : '', photo: validPhoto(p.photo)
                }));
                const used = new Set();
                for (const pin of next.pins) { while (used.has(pin.id)) pin.id += 1; used.add(pin.id); }
            }
            for (const id of Object.keys(next.signatures)) next.signatures[id] = validPhoto(raw.signatures?.[id]);
            return next;
        }

        function refreshFormFromState() {
            renderChecklistSections();
            for (const k of Object.keys(appState.checklist)) applyItemVisualState(k);
            populateVehicleInputs();
            updateFuelUI(appState.vehicle.combustivel);
            renderDamagePins();
            Object.values(signaturePads).forEach(pad => pad.resizeCanvas());
            updateAllBadgesAndStats();
            updateGPSStatusUI();
        }

        function createDefaultState() {
            return {
                meta: {
                    id: generateProtocolId(),
                    updatedAt: new Date().toISOString(),
                    gps: null
                },
                vehicle: {
                    data: todayLocal(),
                    tipo: 'Entrada',
                    vistoriador: '',
                    motorista: '',
                    placa: '',
                    modelo: '',
                    ano: '',
                    cor: '',
                    km: '',
                    combustivel: '1/2',
                    obsGerais: ''
                },
                checklist: {},
                pins: [],
                signatures: {
                    'sig-vistoriador': null,
                    'sig-motorista': null
                }
            };
        }

        let appState = createDefaultState();
        let selectedDamageType = 'Amassado';
        const signaturePads = {};
        let pendingPhotoTarget = null; // { type: 'checklist' | 'pin', id: string | number }

        /**
         * INICIALIZAÇÃO GERAL
         */
        document.addEventListener('DOMContentLoaded', async () => {
            renderChecklistSections();
            await loadPersistence();
            setupVehicleInputs();
            setupFuelSelector();
            setupDiagramInteractions();
            setupSignatureCanvases();
            setupActionButtons();
            setupPhotoCapture();
            refreshFormFromState();
            updateHistoryCounterBadge();
            initPWA();
            setupModalAccessibility();
            setupWorkspaceUI();
            saveToLocalStorage();
            document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
            window.addEventListener('pagehide', flushSave);
        });

                /**
         * 3. CONTROLE DOS EXPANDERS (FECHADOS POR PADRÃO)
         */
        function toggleExpander(cardId, forceOpen = null) {
            const card = document.getElementById(cardId);
            if (!card) return;

            const willOpen = forceOpen !== null ? forceOpen : !card.classList.contains('is-open');
            if (willOpen) {
                // Acordeão exclusivo: fecha as demais seções, inclusive em colunas.
                document.querySelectorAll('.expander-card.is-open').forEach(other => {
                    if (other === card || other.id === 'print-photo-section') return;
                    other.classList.remove('is-open');
                    const otherTrigger = other.querySelector('.expander-trigger') || other.querySelector('.expander-header[aria-expanded]');
                    if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
                });
                card.classList.add('is-open');
                if (cardId === 'exp-assinaturas') {
                    setTimeout(() => {
                        Object.values(signaturePads).forEach(pad => pad.resizeCanvas());
                    }, 30);
                }
            } else {
                card.classList.remove('is-open');
            }
            const trigger = card.querySelector('.expander-trigger') || card.querySelector('.expander-header[aria-expanded]');
            if (trigger) trigger.setAttribute('aria-expanded', String(willOpen));
            if (typeof syncWorkspaceNavigation === 'function') syncWorkspaceNavigation();
        }

        function setAllExpanders(openState) {
            if (openState) {
                // Compatível com a regra de somente uma seção aberta.
                const first = document.querySelector('.expander-card:not(#print-photo-section)');
                if (first) toggleExpander(first.id, true);
            } else {
                document.querySelectorAll('.expander-card.is-open').forEach(card => {
                    if (card.id !== 'print-photo-section') toggleExpander(card.id, false);
                });
            }
        }

        /**
         * 4. RENDERIZAÇÃO DAS SEÇÕES DE CHECKLIST
         */
        function renderChecklistSections() {
            const container = document.getElementById('checklist-sections');
            container.innerHTML = '';

            CHECKLIST_SCHEMA.forEach((section) => {
                const expId = `exp-sec-${section.id}`;
                const sectionEl = document.createElement('section');
                sectionEl.id = expId;
                sectionEl.className = 'expander-card bg-white rounded-2xl border border-slate-200 border-l-[5px] shadow-xs overflow-hidden';
                sectionEl.style.borderLeftColor = section.accentColor;

                let itemsHtml = '';
                section.items.forEach((itemLabel, iIdx) => {
                    const itemId = `${section.id}_${iIdx}`;
                    if (!appState.checklist[itemId]) {
                        appState.checklist[itemId] = { status: null, obs: '', photo: null };
                    }

                    itemsHtml += `
                        <div id="row-${itemId}" class="p-3.5 sm:px-5 border-b border-slate-100 last:border-b-0 transition-colors">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <!-- Título do Item -->
                                <div class="flex items-start gap-2">
                                    <span class="text-xs font-bold text-slate-400 mt-0.5">${iIdx + 1}.</span>
                                    <span class="text-sm font-medium text-slate-800 leading-snug">${itemLabel}</span>
                                </div>

                                <!-- Botões Grandes Mobile-First (Thumb-Friendly) -->
                                <div class="grid grid-cols-12 sm:flex items-center gap-1.5 w-full sm:w-auto shrink-0" role="group" aria-label="Estado de verificação">
                                    <button type="button" onclick="setItemStatus('${itemId}', 'ok')" id="btn-${itemId}-ok"
                                        class="status-btn touch-target-btn col-span-4 sm:w-auto px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 transition flex items-center justify-center gap-1">
                                        <i class="ph-bold ph-check"></i> Conforme
                                    </button>
                                    <button type="button" onclick="setItemStatus('${itemId}', 'nok')" id="btn-${itemId}-nok"
                                        class="status-btn touch-target-btn col-span-4 sm:w-auto px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 transition flex items-center justify-center gap-1">
                                        <i class="ph-bold ph-x"></i> Avaria
                                    </button>
                                    <button type="button" onclick="setItemStatus('${itemId}', 'na')" id="btn-${itemId}-na"
                                        class="status-btn touch-target-btn col-span-2 sm:w-auto px-2 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-500 transition flex items-center justify-center">
                                        N/A
                                    </button>
                                    <button type="button" onclick="toggleObsInput('${itemId}')" id="btn-obs-${itemId}" title="Observação e Foto" aria-label="Adicionar observação ou foto ao item"
                                        class="touch-target-btn col-span-2 sm:w-auto px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0072ce] transition flex items-center justify-center no-print relative">
                                        <i class="ph-bold ph-chat-text text-base"></i>
                                        <span id="photo-dot-${itemId}" class="hidden absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500"></span>
                                    </button>
                                </div>
                            </div>

                            <!-- Campo de Observação e Evidência Fotográfica (OPÇÃO 2) -->
                            <div id="obs-box-${itemId}" class="obs-container hidden mt-2.5 space-y-2">
                                <div class="flex items-center gap-2">
                                    <input type="text" id="obs-input-${itemId}" oninput="updateItemObs('${itemId}', this.value)"
                                        placeholder="Descreva o detalhe ou avaria deste item..."
                                        class="touch-target-btn flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:border-[#0072ce] outline-none transition">
                                    <button type="button" onclick="triggerPhotoCapture('checklist', '${itemId}')" title="Anexar Foto da Avaria"
                                        class="touch-target-btn px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 flex items-center gap-1.5 shrink-0 no-print transition">
                                        <i class="ph-bold ph-camera text-base"></i>
                                        <span class="hidden sm:inline">Foto</span>
                                    </button>
                                </div>
                                <div id="photo-preview-box-${itemId}" class="hidden no-print flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <img id="photo-thumb-${itemId}" src="" alt="Evidência" class="w-14 h-14 object-cover rounded-lg border border-slate-300">
                                    <div class="flex-1 text-xs text-slate-600">
                                        <span class="font-semibold text-slate-800 block">Foto anexada ao item</span>
                                        <span>Será exibida no anexo fotográfico do PDF</span>
                                    </div>
                                    <button type="button" onclick="removeItemPhoto('${itemId}')" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Remover Foto">
                                        <i class="ph-bold ph-trash text-base"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });

                sectionEl.innerHTML = `
                    <div class="expander-header category-header w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 transition" style="background-color: ${section.bgColor};">
                        <button type="button" onclick="toggleExpander('${expId}')" aria-expanded="false" aria-controls="content-${expId}" class="expander-trigger flex-1 min-w-0 flex items-center justify-between gap-2 text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                            <div class="flex items-center gap-3 min-w-0">
                                <span class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-2xs" style="color: ${section.accentColor};">
                                    <i class="ph-duotone ${section.icon} text-xl"></i>
                                </span>
                                <div class="min-w-0">
                                    <h2 class="font-bold text-slate-900 text-sm sm:text-base truncate">${section.title}</h2>
                                    <span class="block text-[11px] text-slate-500 truncate category-subtitle">${section.subtitle}</span>
                                </div>
                            </div>
                            <span class="category-header-status flex items-center gap-2 shrink-0">
                                <span id="badge-sec-${section.id}" class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border" style="color: ${section.accentColor}; border-color: ${section.borderColor};">
                                    0/${section.items.length} verificados
                                </span>
                                <i class="ph-bold ph-caret-down text-slate-500 text-base expander-chevron"></i>
                            </span>
                        </button>
                        <button type="button" onclick="markCategoryAsConforme('${section.id}')" class="category-mark-ok no-print" data-section-id="${section.id}" aria-pressed="false" title="Marcar todos os itens de ${section.title} como Conforme" aria-label="Marcar todos os itens de ${section.title} como Conforme" style="--category-accent:${section.accentColor};--category-tint:${section.bgColor};">
                            <i class="ph-bold ph-checks"></i><span class="category-mark-text">Tudo conforme</span>
                        </button>
                    </div>
                    <div id="content-${expId}" class="expander-body border-t border-slate-100 divide-y divide-slate-100">
                        ${itemsHtml}
                    </div>
                `;

                container.appendChild(sectionEl);
            });
        }

        /**
         * 5. INTERAÇÃO COM OS ITENS DO CHECKLIST
         */
        function setItemStatus(itemId, status) {
            const current = appState.checklist[itemId].status;
            const nextStatus = current === status ? null : status;
            appState.checklist[itemId].status = nextStatus;

            applyItemVisualState(itemId);

            if (nextStatus === 'nok') {
                const obsBox = document.getElementById(`obs-box-${itemId}`);
                obsBox.classList.remove('hidden');
            }

            updateAllBadgesAndStats();
            saveToLocalStorage();
        }

        function applyItemVisualState(itemId) {
            const state = appState.checklist[itemId];
            const btnOk = document.getElementById(`btn-${itemId}-ok`);
            const btnNok = document.getElementById(`btn-${itemId}-nok`);
            const btnNa = document.getElementById(`btn-${itemId}-na`);
            const row = document.getElementById(`row-${itemId}`);

            btnOk.className = 'status-btn touch-target-btn col-span-4 sm:w-auto px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 transition flex items-center justify-center gap-1';
            btnNok.className = 'status-btn touch-target-btn col-span-4 sm:w-auto px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 transition flex items-center justify-center gap-1';
            btnNa.className = 'status-btn touch-target-btn col-span-2 sm:w-auto px-2 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-500 transition flex items-center justify-center';
            row.classList.remove('bg-emerald-50/40', 'bg-rose-50/40');
            [btnOk, btnNok, btnNa].forEach(btn => btn.setAttribute('aria-pressed', 'false'));

            if (state.status === 'ok') {
                btnOk.className = 'status-btn status-ok-active touch-target-btn col-span-4 sm:w-auto px-2.5 py-2 rounded-xl text-xs font-semibold border border-emerald-600 bg-emerald-600 text-white shadow-xs transition flex items-center justify-center gap-1';
                row.classList.add('bg-emerald-50/40');
            } else if (state.status === 'nok') {
                btnNok.className = 'status-btn status-nok-active touch-target-btn col-span-4 sm:w-auto px-2.5 py-2 rounded-xl text-xs font-semibold border border-rose-600 bg-rose-600 text-white shadow-xs transition flex items-center justify-center gap-1';
                row.classList.add('bg-rose-50/40');
            } else if (state.status === 'na') {
                btnNa.className = 'status-btn status-na-active touch-target-btn col-span-2 sm:w-auto px-2 py-2 rounded-xl text-xs font-semibold border border-slate-600 bg-slate-600 text-white shadow-xs transition flex items-center justify-center';
            }

            if (state.status === 'ok') btnOk.setAttribute('aria-pressed','true');
            if (state.status === 'nok') btnNok.setAttribute('aria-pressed','true');
            if (state.status === 'na') btnNa.setAttribute('aria-pressed','true');

            const obsBox = document.getElementById(`obs-box-${itemId}`);
            const obsInput = document.getElementById(`obs-input-${itemId}`);
            const btnObs = document.getElementById(`btn-obs-${itemId}`);
            const photoDot = document.getElementById(`photo-dot-${itemId}`);
            const previewBox = document.getElementById(`photo-preview-box-${itemId}`);
            const thumbImg = document.getElementById(`photo-thumb-${itemId}`);

            if (obsInput.value !== (state.obs || '')) obsInput.value = state.obs || '';
            const hasObs = state.obs && state.obs.trim() !== '';
            const hasPhoto = Boolean(state.photo);

            if (hasObs || hasPhoto) {
                obsBox.classList.remove('hidden');
                btnObs.classList.add('text-[#0072ce]', 'border-blue-300', 'bg-blue-50');
            } else {
                btnObs.classList.remove('text-[#0072ce]', 'border-blue-300', 'bg-blue-50');
            }

            if (hasObs) {
                obsBox.classList.add('has-content');
            } else {
                obsBox.classList.remove('has-content');
            }

            if (hasPhoto) {
                photoDot.classList.remove('hidden');
                previewBox.classList.remove('hidden');
                thumbImg.src = state.photo;
            } else {
                photoDot.classList.add('hidden');
                previewBox.classList.add('hidden');
                thumbImg.removeAttribute('src');
            }
        }

        function toggleObsInput(itemId) {
            const obsBox = document.getElementById(`obs-box-${itemId}`);
            const input = document.getElementById(`obs-input-${itemId}`);
            obsBox.classList.toggle('hidden');
            if (!obsBox.classList.contains('hidden')) {
                input.focus();
            }
        }

        function updateItemObs(itemId, value) {
            appState.checklist[itemId].obs = value;
            applyItemVisualState(itemId);
            saveToLocalStorage();
        }

        /** Mantém o indicador do botão de categoria sincronizado com cada alteração individual. */
        function updateCategoryToggleButtons() {
            if (typeof document.querySelector !== 'function') return;
            CHECKLIST_SCHEMA.forEach(section => {
                const button = document.querySelector(`.category-mark-ok[data-section-id="${section.id}"]`);
                if (!button) return;
                const allOk = section.items.every((_, i) => appState.checklist[`${section.id}_${i}`]?.status === 'ok');
                button.classList.toggle('is-all-conforme', allOk);
                button.setAttribute('aria-pressed', String(allOk));
                const label = allOk ? `Desmarcar todos os itens de ${section.title}` : `Marcar todos os itens de ${section.title} como Conforme`;
                button.setAttribute('title', label);
                button.setAttribute('aria-label', label);
                const text = button.querySelector('.category-mark-text');
                if (text) text.textContent = allOk ? 'Desmarcar todos' : 'Tudo conforme';
            });
        }

        /** Marca somente a categoria escolhida. Não altera notas, fotos ou outras seções. */
        function markCategoryAsConforme(sectionId) {
            const category = CHECKLIST_SCHEMA.find(section => section.id === sectionId);
            if (!category) return;
            const keys = category.items.map((_, i) => `${sectionId}_${i}`);
            const countNok = keys.filter(key => appState.checklist[key].status === 'nok').length;
            const countNa = keys.filter(key => appState.checklist[key].status === 'na').length;
            const countPending = keys.filter(key => appState.checklist[key].status !== 'ok').length;
            const allConforme = countPending === 0;
            const apply = () => {
                keys.forEach(itemId => {
                    appState.checklist[itemId].status = allConforme ? null : 'ok';
                    applyItemVisualState(itemId);
                });
                updateAllBadgesAndStats();
                updateCategoryToggleButtons();
                saveToLocalStorage();
                showToast(`${category.title.replace(/^\d+\.\s*/, '')}: ${allConforme ? 'marcação removida' : 'todos os itens marcados como Conforme'}.`);
            };
            if (allConforme) {
                apply();
                return;
            }
            // Não sobrescrever silenciosamente registros de avaria ou N/A.
            if (countNok || countNa) {
                openConfirmModal('Sobrescrever status desta categoria?',
                    `A categoria ${category.title} contém ${countNok} avaria(s) e ${countNa} item(ns) N/A. Todos os seus ${keys.length} itens serão marcados como Conforme. Observações e fotos serão preservadas.`,
                    apply, 'Marcar categoria');
                return;
            }
            apply();
        }

        /**
         * CAPTURA E COMPRESSÃO DE EVIDÊNCIAS FOTOGRÁFICAS (OPÇÃO 2)
         */
        function setupPhotoCapture() {
            const fileInput = document.getElementById('camera-file-input');
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file || !pendingPhotoTarget) return;
                if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
                    fileInput.value = '';
                    pendingPhotoTarget = null;
                    showToast('Use JPG, PNG ou WebP com até 12 MB.');
                    return;
                }
                const target = pendingPhotoTarget;

                compressImageFile(file, 800, 0.72, (compressedDataUrl) => {
                    if (target.type === 'checklist') {
                        const itemId = target.id;
                        appState.checklist[itemId].photo = compressedDataUrl;
                        applyItemVisualState(itemId);
                    } else if (target.type === 'pin') {
                        const pin = appState.pins.find(p => p.id === target.id);
                        if (pin) {
                            pin.photo = compressedDataUrl;
                            renderDamagePins();
                        }
                    }
                    pendingPhotoTarget = null;
                    fileInput.value = '';
                    updateAllBadgesAndStats();
                    saveToLocalStorage();
                    showToast('Foto comprimida e anexada!');
                });
            });
        }

        function triggerPhotoCapture(type, id) {
            pendingPhotoTarget = { type, id };
            document.getElementById('camera-file-input').click();
        }

        function removeItemPhoto(itemId) {
            appState.checklist[itemId].photo = null;
            applyItemVisualState(itemId);
            updateAllBadgesAndStats();
            saveToLocalStorage();
            showToast('Foto removida do item');
        }

        function removePinPhoto(pinId) {
            const pin = appState.pins.find(p => p.id === pinId);
            if (pin) {
                pin.photo = null;
                renderDamagePins();
                updateAllBadgesAndStats();
                saveToLocalStorage();
                showToast('Foto removida do ponto');
            }
        }

        function compressImageFile(file, maxWidth, quality, callback) {
            const reader = new FileReader();
            reader.onerror = () => showToast('Não foi possível abrir a imagem.');
            reader.onload = event => {
                const img = new Image();
                img.onerror = () => showToast('Formato de imagem não reconhecido.');
                img.onload = () => {
                    const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { showToast('Não foi possível processar a foto.'); return; }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    try {callback(canvas.toDataURL('image/jpeg', quality));}
                    catch {showToast('Não foi possível compactar a foto.');}
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }


                /**
         * 6. ATUALIZAÇÃO DE BADGES E ESTATÍSTICAS
         */
        function getAllAttachedPhotos() {
            const photos = [];
            CHECKLIST_SCHEMA.forEach(sec => {
                sec.items.forEach((label, idx) => {
                    const itemId = `${sec.id}_${idx}`;
                    const entry = appState.checklist[itemId];
                    if (entry && entry.photo) {
                        photos.push({
                            title: label,
                            subtitle: entry.obs ? `Obs: ${entry.obs}` : sec.title,
                            src: entry.photo
                        });
                    }
                });
            });
            appState.pins.forEach((pin, idx) => {
                if (pin.photo) {
                    photos.push({
                        title: `Ponto #${idx + 1} (${pin.type})`,
                        subtitle: pin.desc || 'Marcação no Croqui Visual',
                        src: pin.photo
                    });
                }
            });
            return photos;
        }

        function updateAllBadgesAndStats() {
            const keys = CHECKLIST_SCHEMA.flatMap(section => section.items.map((_, i) => `${section.id}_${i}`));
            const total = keys.length;
            let ok = 0, nok = 0, na = 0, answered = 0;

            keys.forEach(k => {
                const st = appState.checklist[k].status;
                if (st) answered++;
                if (st === 'ok') ok++;
                if (st === 'nok') nok++;
                if (st === 'na') na++;
            });

            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            document.getElementById('stat-ok').textContent = ok;
            document.getElementById('stat-nok').textContent = nok;
            document.getElementById('stat-progress').textContent = `${pct}%`;
            document.getElementById('progress-bar').style.width = `${pct}%`;

            const photosCount = getAllAttachedPhotos().length;

            // Sincroniza resumo do cabeçalho de impressão
            document.getElementById('print-stat-total').textContent = total;
            document.getElementById('print-stat-ok').textContent = ok;
            document.getElementById('print-stat-nok').textContent = nok;
            document.getElementById('print-stat-na').textContent = na;
            document.getElementById('print-stat-pins').textContent = appState.pins.length;
            document.getElementById('print-stat-photos').textContent = photosCount;

            // Badge Identificação
            const idFields = ['vistoriador', 'motorista', 'placa', 'modelo', 'cor', 'km'];
            const filledIdCount = idFields.filter(f => (appState.vehicle[f] || '').toString().trim() !== '').length;
            document.getElementById('badge-identificacao').textContent = `${filledIdCount}/${idFields.length} preenchidos`;

            // Badges Categorias
            CHECKLIST_SCHEMA.forEach(section => {
                let secAnswered = 0;
                section.items.forEach((_, iIdx) => {
                    const itemId = `${section.id}_${iIdx}`;
                    if (appState.checklist[itemId] && appState.checklist[itemId].status) {
                        secAnswered++;
                    }
                });
                const secBadge = document.getElementById(`badge-sec-${section.id}`);
                if (secBadge) {
                    secBadge.textContent = `${secAnswered}/${section.items.length} verificados`;
                }
            });

            // Badge Croqui
            const pinsCount = appState.pins.length;
            document.getElementById('badge-croqui').textContent = pinsCount === 1 ? '1 avaria' : `${pinsCount} avarias`;

            // Badge Assinaturas
            const sigV = Boolean(appState.signatures['sig-vistoriador']);
            const sigM = Boolean(appState.signatures['sig-motorista']);
            const badgeSig = document.getElementById('badge-assinaturas');
            if (sigV && sigM) {
                badgeSig.textContent = 'Assinado (2/2)';
            } else if (sigV || sigM) {
                badgeSig.textContent = 'Parcial (1/2)';
            } else {
                badgeSig.textContent = 'Pendente';
            }
        
            updateCategoryToggleButtons();
        }

        /**
         * VALIDAÇÃO INTELIGENTE E PREPARAÇÃO ANTI-CORTE DO PDF (OPÇÕES 1 & 4)
         */
        function validateAndPrint() {
            const missing = [];
            if (!appState.vehicle.placa.trim()) missing.push('Placa do veículo');
            if (!appState.vehicle.modelo.trim()) missing.push('Marca / Modelo');
            if (!appState.vehicle.km.toString().trim()) missing.push('Quilometragem (KM)');
            if (!appState.vehicle.vistoriador.trim()) missing.push('Vistoriador Responsável');
            if (!appState.vehicle.motorista.trim()) missing.push('Motorista / Condutor');
            if (!appState.signatures['sig-vistoriador'] && !appState.signatures['sig-motorista']) {
                missing.push('Pelo menos 1 assinatura digital');
            }

            if (missing.length > 0) {
                const listHtml = `<p class="mb-2">Os seguintes campos importantes ainda não foram preenchidos:</p>
                    <ul class="list-disc pl-5 space-y-1 text-xs font-semibold text-slate-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                        ${missing.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                    <p class="mt-2.5 text-xs text-slate-500">Deseja gerar o PDF mesmo assim ou voltar para preencher?</p>`;

                openConfirmModal(
                    'Campos Pendentes no Laudo',
                    listHtml,
                    () => prepareAndPrint(),
                    'Gerar PDF Mesmo Assim',
                    'Voltar e Preencher'
                );
            } else {
                prepareAndPrint();
            }
        }

        async function prepareAndPrint() {
            await flushSave();
            const now = new Date();
            const formattedDate = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit', second:'2-digit'});
            document.getElementById('print-emission-datetime').textContent = formattedDate;
            document.getElementById('print-protocol-id').textContent = `#${appState.meta.id}`;
            const v = appState.vehicle;
            document.getElementById('p-v-data-tipo').textContent = `${v.data ? v.data.split('-').reverse().join('/') : '-'} • ${v.tipo || '-'}`;
            document.getElementById('p-v-placa').textContent = v.placa || 'NÃO INFORMADA';
            document.getElementById('p-v-modelo').textContent = v.modelo || '-';
            document.getElementById('p-v-ano-cor').textContent = `${v.ano || '-'} / ${v.cor || '-'}`;
            document.getElementById('p-v-km').textContent = v.km ? `${v.km} KM` : '-';
            document.getElementById('p-v-combustivel').textContent = v.combustivel || '-';
            document.getElementById('p-v-vistoriador').textContent = v.vistoriador || '-';
            document.getElementById('p-v-motorista').textContent = v.motorista || '-';
            const g = appState.meta.gps;
            document.getElementById('print-gps-badge').textContent = g && Number.isFinite(g.lat) ? `GPS: ${g.lat.toFixed(5)}, ${g.lng.toFixed(5)}` : '';
            for (const id of ['sig-vistoriador','sig-motorista']) {
                const el = document.getElementById(`img-print-${id}`);
                const source = appState.signatures[id];
                if (source) el.src = source;
                else el.removeAttribute('src');
            }
            const photos = getAllAttachedPhotos();
            const section = document.getElementById('print-photo-section');
            const grid = document.getElementById('print-photo-grid');
            section.classList.toggle('hidden', photos.length === 0);
            section.classList.toggle('is-open', photos.length > 0);
            document.getElementById('badge-print-photos').textContent = `${photos.length} foto(s)`;
            grid.innerHTML = photos.map(photo => `
                <figure class="print-photo-card border border-slate-300 rounded-lg p-2 bg-slate-50">
                    <img src="${photo.src}" alt="${safeText(photo.title)}" class="w-full h-36 object-cover rounded border border-slate-200 mb-1.5">
                    <figcaption><strong class="block text-[8pt] text-slate-900 leading-tight">${safeText(photo.title)}</strong>
                    <span class="block text-[7pt] text-slate-600">${safeText(photo.subtitle)}</span></figcaption>
                </figure>`).join('');
            updateAllBadgesAndStats();
            const images = [...document.querySelectorAll('#print-photo-grid img, .sig-print-img[src]')];
            await Promise.all(images.map(image => image.decode ? image.decode().catch(() => {}) : Promise.resolve()));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            window.print();
        }

                /**
         * 7. INPUTS DO VEÍCULO COM MÁSCARAS E FORMATAÇÃO (OPÇÃO 5)
         */
        function formatPlateMask(raw) {
            const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
            if (clean.length > 3) {
                return clean.slice(0, 3) + '-' + clean.slice(3);
            }
            return clean;
        }

        function formatKmMask(raw) {
            const digits = raw.replace(/\D/g, '');
            if (!digits) return '';
            return Number(digits).toLocaleString('pt-BR');
        }

        function setupVehicleInputs() {
            const fieldMap = {
                'v-data':'data','v-tipo':'tipo','v-vistoriador':'vistoriador','v-motorista':'motorista',
                'v-placa':'placa','v-modelo':'modelo','v-ano':'ano','v-cor':'cor','v-km':'km','v-obs-gerais':'obsGerais'
            };
            Object.entries(fieldMap).forEach(([id, field]) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.addEventListener('input', event => {
                    let val = event.target.value;
                    if (id === 'v-placa') val = formatPlateMask(val);
                    if (id === 'v-km') val = formatKmMask(val);
                    if (event.target.value !== val) event.target.value = val;
                    appState.vehicle[field] = val;
                    if (id === 'v-vistoriador') document.getElementById('sig-label-vistoriador').textContent = val || 'Assine acima';
                    if (id === 'v-motorista') document.getElementById('sig-label-motorista').textContent = val || 'Assine acima';
                    updateAllBadgesAndStats();
                    saveToLocalStorage();
                });
            });
            populateVehicleInputs();
        }

        function populateVehicleInputs() {
            const fields = ['data','tipo','vistoriador','motorista','placa','modelo','ano','cor','km','obsGerais'];
            for (const field of fields) {
                const el = document.getElementById(`v-${field === 'obsGerais' ? 'obs-gerais' : field}`);
                if (el) el.value = appState.vehicle[field] ?? '';
            }
            document.getElementById('sig-label-vistoriador').textContent = appState.vehicle.vistoriador || 'Assine acima';
            document.getElementById('sig-label-motorista').textContent = appState.vehicle.motorista || 'Assine acima';
            updateGPSStatusUI();
        }


                function captureGPSLocation() {
            if (!('geolocation' in navigator)) {
                showToast('Geolocalização não suportada neste dispositivo');
                return;
            }
            const statusEl = document.getElementById('gps-status-text');
            statusEl.textContent = 'Obtendo coordenadas GPS...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    appState.meta.gps = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    updateGPSStatusUI();
                    saveToLocalStorage();
                    showToast('Localização GPS registrada!');
                },
                () => {
                    statusEl.textContent = 'Não foi possível obter o GPS (verifique permissões)';
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }

        function updateGPSStatusUI() {
            const statusEl = document.getElementById('gps-status-text');
            if (appState.meta && appState.meta.gps && Number.isFinite(appState.meta.gps.lat)) {
                statusEl.textContent = `GPS: ${appState.meta.gps.lat.toFixed(5)}, ${appState.meta.gps.lng.toFixed(5)}`;
            } else {
                statusEl.textContent = 'Localização GPS não registrada';
            }
        }

        function setupFuelSelector() {
            document.querySelectorAll('.fuel-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const val = btn.dataset.fuel;
                    appState.vehicle.combustivel = val;
                    updateFuelUI(val);
                    saveToLocalStorage();
                });
            });
            updateFuelUI(appState.vehicle.combustivel || '1/2');
        }

        function updateFuelUI(selectedVal) {
            document.getElementById('v-combustivel').value = selectedVal;
            document.querySelectorAll('.fuel-btn').forEach(btn => {
                if (btn.dataset.fuel === selectedVal) {
                    btn.className = 'fuel-btn min-h-[36px] px-1 rounded-lg text-xs font-semibold transition bg-[#0072ce] text-white shadow-xs';
                } else {
                    btn.className = 'fuel-btn min-h-[36px] px-1 rounded-lg text-xs font-semibold transition text-slate-600 hover:bg-white/60';
                }
            });
        }

        /**
         * 8. CROQUI VISUAL INTERATIVO DE AVARIAS
         */
        function setupDiagramInteractions() {
            document.querySelectorAll('.damage-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedDamageType = btn.dataset.damageType;
                    document.querySelectorAll('.damage-type-btn').forEach(b => {
                        b.className = 'damage-type-btn touch-target-btn px-2 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition';
                    });
                    btn.className = 'damage-type-btn touch-target-btn px-2 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow-xs transition';
                });
            });

            const diagram = document.getElementById('car-diagram-container');
            diagram.addEventListener('click', (e) => {
                if (e.target.closest('.damage-pin')) return;
                const rect = diagram.getBoundingClientRect();
                const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                const yPct = ((e.clientY - rect.top) / rect.height) * 100;
                addDamagePin(xPct, yPct);
            });
            diagram.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addDamagePin(50, 50);
                    showToast('Ponto registrado no centro do croqui. Edite a descrição ao lado.');
                }
            });

            function addDamagePin(xPct, yPct) {
                if (appState.pins.length >= 300) {
                    showToast('Limite de 300 marcações por vistoria.');
                    return;
                }
                appState.pins.push({
                    id: Date.now() * 1000 + Math.floor(Math.random()*1000),
                    x: Math.max(4, Math.min(96, xPct)),
                    y: Math.max(6, Math.min(94, yPct)),
                    type: selectedDamageType,
                    desc: '',
                    photo: null
                });

                renderDamagePins();
                updateAllBadgesAndStats();
                saveToLocalStorage();
            }

            document.getElementById('btn-clear-pins').addEventListener('click', () => {
                if (appState.pins.length === 0) return;
                openConfirmModal('Remover todas as marcações?', 'As avarias e fotos associadas aos pontos do croqui serão apagadas.', () => {
                    appState.pins = [];
                    renderDamagePins();
                    updateAllBadgesAndStats();
                    saveToLocalStorage();
                    showToast('Pontos do croqui removidos.');
                }, 'Remover pontos');
            });

            renderDamagePins();
        }

        function renderDamagePins() {
            const pinsLayer = document.getElementById('pins-layer');
            const listEl = document.getElementById('damage-list');
            pinsLayer.innerHTML = '';

            if (appState.pins.length === 0) {
                listEl.innerHTML = `
                    <div class="text-center py-7 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        Nenhuma avaria marcada no desenho.<br>Toque no croqui para registrar.
                    </div>
                `;
                return;
            }

            listEl.innerHTML = '';
            appState.pins.forEach((pin, idx) => {
                const num = idx + 1;

                const pinEl = document.createElement('div');
                pinEl.className = 'damage-pin absolute w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white pointer-events-auto cursor-pointer';
                pinEl.style.left = `${pin.x}%`;
                pinEl.style.top = `${pin.y}%`;
                pinEl.textContent = num;
                pinEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const input = document.getElementById(`pin-desc-${pin.id}`);
                    if (input) input.focus();
                });
                pinsLayer.appendChild(pinEl);

                const itemEl = document.createElement('div');
                itemEl.className = 'bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2';
                itemEl.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">${num}</span>
                        <div class="flex-1 min-w-0">
                            <span class="block text-[11px] font-bold text-rose-700 leading-tight">${safeText(pin.type)}</span>
                            <input type="text" id="pin-desc-${pin.id}" value="${safeText(pin.desc)}" placeholder="Local / detalhe da avaria..."
                                oninput="updatePinDesc(${pin.id}, this.value)"
                                class="w-full text-xs bg-transparent border-b border-slate-300 focus:border-[#0072ce] outline-none py-1 text-slate-700">
                        </div>
                        <button type="button" onclick="triggerPhotoCapture('pin', ${pin.id})" title="Anexar Foto"
                            class="p-2 ${pin.photo ? 'text-sky-600 bg-sky-100' : 'text-slate-500 hover:text-sky-600'} rounded-lg transition no-print">
                            <i class="ph-bold ph-camera text-base"></i>
                        </button>
                        <button type="button" onclick="removePin(${pin.id})" title="Remover"
                            class="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition no-print">
                            <i class="ph-bold ph-trash text-base"></i>
                        </button>
                    </div>
                    ${pin.photo ? `
                        <div class="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-200 no-print">
                            <div class="flex items-center gap-2">
                                <img src="${pin.photo}" class="w-10 h-10 object-cover rounded border border-slate-300" alt="Avaria">
                                <span class="text-[11px] text-slate-600 font-medium">Foto anexada ao ponto #${num}</span>
                            </div>
                            <button type="button" onclick="removePinPhoto(${pin.id})" class="text-[11px] text-rose-600 font-semibold px-2 py-1 hover:bg-rose-50 rounded">Remover</button>
                        </div>
                    ` : ''}
                `;
                listEl.appendChild(itemEl);
            });
        }

        function updatePinDesc(pinId, val) {
            const pin = appState.pins.find(p => p.id === pinId);
            if (pin) {
                pin.desc = val;
                saveToLocalStorage();
            }
        }

        function removePin(pinId) {
            appState.pins = appState.pins.filter(p => p.id !== pinId);
            renderDamagePins();
            updateAllBadgesAndStats();
            saveToLocalStorage();
        }

        /**
         * 9. ASSINATURAS DIGITAIS EM CANVAS
         */
        function setupSignatureCanvases() {
            ['sig-vistoriador', 'sig-motorista'].forEach(canvasId => {
                const canvas = document.getElementById(canvasId);
                const ctx = canvas.getContext('2d');
                let isDrawing = false;

                function resizeCanvas() {
                    const rect = canvas.parentElement.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;
                    const dataUrl = appState.signatures[canvasId];
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                    ctx.lineWidth = 2.4;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#0f172a';

                    if (dataUrl) {
                        const img = new Image();
                        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        img.src = dataUrl;
                    }
                }

                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);

                function getCoords(e) {
                    const rect = canvas.getBoundingClientRect();
                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    return {
                        x: clientX - rect.left,
                        y: clientY - rect.top
                    };
                }

                function startDraw(e) {
                    isDrawing = true;
                    const { x, y } = getCoords(e);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                }

                function draw(e) {
                    if (!isDrawing) return;
                    if (e.cancelable) e.preventDefault();
                    const { x, y } = getCoords(e);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }

                function endDraw() {
                    if (!isDrawing) return;
                    isDrawing = false;
                    appState.signatures[canvasId] = canvas.toDataURL();
                    updateAllBadgesAndStats();
                    saveToLocalStorage();
                }

                canvas.addEventListener('mousedown', startDraw);
                canvas.addEventListener('mousemove', draw);
                window.addEventListener('mouseup', endDraw);

                canvas.addEventListener('touchstart', startDraw, { passive: false });
                canvas.addEventListener('touchmove', draw, { passive: false });
                canvas.addEventListener('touchend', endDraw);

                signaturePads[canvasId] = { canvas, ctx, resizeCanvas };
            });
        }

        function clearSignature(canvasId) {
            const pad = signaturePads[canvasId];
            if (!pad) return;
            pad.ctx.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
            appState.signatures[canvasId] = null;
            updateAllBadgesAndStats();
            saveToLocalStorage();
        }

        /**
         * 10. HISTÓRICO DE VISTORIAS, COMPARATIVO E BACKUP JSON (OPÇÃO 3)
         */


        function updateHistoryCounterBadge() {
            const count = getHistoryList().length;
            const dot = document.getElementById('history-count-dot');
            dot.textContent = count > 999 ? '999+' : String(count);
            dot.classList.toggle('hidden', count === 0);
            dot.setAttribute('aria-label', `${count} vistorias arquivadas`);
            const total = document.getElementById('history-total-count');
            if (total) total.textContent = `${count} ${count === 1 ? 'registro arquivado' : 'registros arquivados'}`;
        }

        let historyReturnFocus = null;
        function openHistoryModal() {
            const modal = document.getElementById('history-modal');
            if (modal.classList.contains('hidden')) historyReturnFocus = document.activeElement;
            renderHistoryList();
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            syncModalLayers();
            modal.querySelector('button[aria-label="Fechar histórico"]')?.focus();
        }

        function closeHistoryModal() {
            const modal = document.getElementById('history-modal');
            if (modal.classList.contains('hidden') || !document.getElementById('confirm-modal').classList.contains('hidden')) return;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            syncModalLayers();
            const focusTarget = historyReturnFocus;
            historyReturnFocus = null;
            if (focusTarget?.isConnected) focusTarget.focus();
        }

        /** Serializa operações de arquivo para não perder salvamentos rápidos. */
        let historyMutationQueue = Promise.resolve();
        function enqueueHistoryMutation(transform) {
            const operation = historyMutationQueue.catch(() => {}).then(async () => {
                const list = [...getHistoryList()];
                return saveHistoryList(transform(list));
            });
            historyMutationQueue = operation;
            return operation;
        }

        async function saveCurrentToHistory() {
            const button = document.getElementById('btn-save-current-history');
            if (button) button.disabled = true;
            // Cada ação é um registro histórico, mesmo para o mesmo protocolo.
            const snapshot = JSON.parse(JSON.stringify(appState));
            snapshot.meta.savedAt = new Date().toISOString();
            snapshot.meta.archiveId = generateHistoryEntryId();
            if (!snapshot.meta.id) snapshot.meta.id = generateProtocolId();
            try {
                const saved = await enqueueHistoryMutation(list => [snapshot, ...list]);
                if (saved) {
                    renderHistoryList();
                    showToast(`Vistoria arquivada. ${getHistoryList().length} registro(s) salvos.`);
                } else {
                    showToast('Falha ao arquivar: exporte o backup JSON e libere armazenamento.');
                }
            } finally {
                if (button) button.disabled = false;
            }
        }

        function renderHistoryList() {
            const container = document.getElementById('history-list-container');
            const list = getHistoryList();

            if (list.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        Nenhuma vistoria salva no histórico local.<br>Clique em "Salvar Vistoria Atual" para arquivar este laudo.
                    </div>
                `;
                return;
            }

            container.innerHTML = list.map((item, idx) => {
                const placa = item.vehicle?.placa || 'SEM PLACA';
                const modelo = item.vehicle?.modelo || 'Modelo não informado';
                const tipo = item.vehicle?.tipo || 'Vistoria';
                const data = item.vehicle?.data ? item.vehicle.data.split('-').reverse().join('/') : '-';
                const pinsCount = (item.pins || []).length;
                const savedAt = item.meta?.savedAt ? new Date(item.meta.savedAt) : null;
                const timestamp = savedAt && !Number.isNaN(savedAt.valueOf()) ? savedAt.toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'}) : 'Arquivo antigo';

                return `
                    <div class="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="px-2 py-0.5 rounded bg-[#004b93] text-white font-mono font-bold text-xs">${safeText(placa)}</span>
                                <span class="text-xs font-bold text-slate-700">${safeText(modelo)}</span>
                                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${safeText(tipo)}</span>
                            </div>
                            <p class="text-[11px] text-slate-500">
                                Protocolo #${safeText(item.meta?.id || '-')} • Data: ${safeText(data)} • ${pinsCount} ponto(s) no croqui
                                <span class="block mt-1 text-[10px] text-blue-700 font-semibold">Registro ${list.length - idx} · Salvo em ${safeText(timestamp)}</span>
                            </p>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" onclick="loadFromHistory(${idx}, false)" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-[#004b93] hover:bg-blue-100 transition">
                                Abrir
                            </button>
                            <button type="button" onclick="loadFromHistory(${idx}, true)" title="Duplicar como Saída (Check-out)" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition">
                                Base Check-out
                            </button>
                            <button type="button" onclick="deleteHistoryItem(${idx})" title="Excluir" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                                <i class="ph-bold ph-trash text-base"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function loadFromHistory(index, asCheckoutClone = false) {
            const selected = getHistoryList()[index];
            if (!selected) return;
            appState = normalizeState(selected);
            if (asCheckoutClone) {
                appState.meta.id = generateProtocolId();
                appState.vehicle.tipo = 'Saída';
                appState.vehicle.data = todayLocal();
                appState.signatures = {'sig-vistoriador':null, 'sig-motorista':null};
            }
            refreshFormFromState();
            setAllExpanders(false);
            saveToLocalStorage();
            closeHistoryModal();
            showToast(asCheckoutClone ? 'Nova vistoria de Saída criada a partir do histórico.' : 'Vistoria restaurada com assinaturas.');
        }


        function deleteHistoryItem(index) {
            const chosen = getHistoryList()[index];
            if (!chosen) return;
            const archiveId = chosen.meta?.archiveId;
            openConfirmModal('Excluir vistoria do histórico?',
                'O registro será removido do histórico deste dispositivo. Exporte um backup antes, se precisar preservá-lo.',
                async () => {
                    const saved = await enqueueHistoryMutation(list => {
                        const offset = list.findIndex(item => item.meta?.archiveId === archiveId);
                        if (offset !== -1) list.splice(offset, 1);
                        return list;
                    });
                    if (saved) {
                        renderHistoryList();
                        showToast('Vistoria excluída do histórico.');
                    } else showToast('Não foi possível excluir a vistoria no armazenamento.');
                }, 'Excluir registro');
        }

                function exportCurrentJSON() {
            const placa = (appState.vehicle.placa || 'veiculo').replace(/[^A-Z0-9]/gi, '');
            const filename = `vistoria_${placa}_${appState.vehicle.data || 'laudo'}.json`;
            const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 30000);
            showToast('Backup JSON exportado!');
        }

        function importJSONFile(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 15 * 1024 * 1024) {
                showToast('Backup maior que 15 MB. Reduza as fotos antes de importar.');
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const incoming = JSON.parse(e.target.result);
                    if (!incoming.checklist || !incoming.vehicle) throw new Error('Formato inválido');
                    const next = normalizeState(incoming);
                    openConfirmModal('Substituir a vistoria atual?',
                        'A vistoria importada substituirá o rascunho atual. Salve o rascunho no histórico ou exporte um backup antes de prosseguir.',
                        () => {
                            appState = next;
                            refreshFormFromState();
                            setAllExpanders(false);
                            saveToLocalStorage();
                            closeHistoryModal();
                            showToast('Vistoria importada com sucesso.');
                        }, 'Importar vistoria');
                } catch (err) {
                    showToast('JSON inválido ou incompatível com o modelo de vistoria.');
                }
                event.target.value = '';
            };
            reader.onerror = () => showToast('Não foi possível ler este arquivo JSON.');
            reader.readAsText(file);
        }


                /**
         * 11. BOTÕES DE AÇÃO GLOBAL E MODAL
         */
        function setupActionButtons() {
            document.getElementById('btn-expand-all').addEventListener('click', () => setAllExpanders(true));
            document.getElementById('btn-collapse-all').addEventListener('click', () => setAllExpanders(false));

            document.getElementById('btn-mark-all-ok').addEventListener('click', () => {
                openConfirmModal(
                    'Marcar Todos como Conforme?',
                    'Todos os itens das 6 categorias serão marcados como "Conforme". Você poderá alterar itens com avarias individualmente.',
                    () => {
                        Object.keys(appState.checklist).forEach(itemId => {
                            appState.checklist[itemId].status = 'ok';
                            applyItemVisualState(itemId);
                        });
                        updateAllBadgesAndStats();
                        saveToLocalStorage();
                        showToast('Todos os itens marcados como Conforme!');
                    }
                );
            });

            document.getElementById('btn-reset-form').addEventListener('click', () => {
                openConfirmModal(
                    'Limpar Todo o Formulário?',
                    'Esta ação apagará os dados do veículo, respostas do checklist, marcações do croqui, fotos e assinaturas.',
                    () => {
                        appState = createDefaultState();
                        refreshFormFromState();
                        saveToLocalStorage();
                        setAllExpanders(false);
                        updateAllBadgesAndStats();
                        showToast('Formulário reiniciado!');
                    }
                );
            });
        }

        /**
         * 11A. WORKSPACE RESPONSIVO — somente preferências da interface.
         * Não modifica appState nem o esquema de armazenamento de vistorias.
         */
        const UI_LAYOUT_KEY = 'vistoria_veicular_ui_layout_v1';
        let settingsReturnFocus = null;

        function setWorkspaceLayout(mode) {
            const selected = mode === 'list' ? 'list' : 'columns';
            document.body.classList.toggle('layout-list', selected === 'list');
            document.body.classList.toggle('layout-columns', selected === 'columns');
            document.querySelectorAll('[data-layout], .layout-switch-btn').forEach(btn => {
                const isSelected = btn.dataset.layout === selected || btn.id === `btn-layout-${selected}`;
                btn.classList.toggle('is-selected', isSelected);
                if (btn.classList.contains('layout-switch-btn')) btn.setAttribute('aria-pressed', String(isSelected));
                if (btn.hasAttribute('data-layout')) {
                    btn.setAttribute('aria-pressed', String(isSelected));
                    btn.textContent = isSelected ? 'Selecionado' : selected === 'list' ? 'Usar colunas' : 'Usar lista';
                    // O rótulo do botão representa sempre a ação que ele executa.
                    if (!isSelected) btn.textContent = btn.dataset.layout === 'list' ? 'Usar lista' : 'Usar colunas';
                }
            });
            try { localStorage.setItem(UI_LAYOUT_KEY, selected); }
            catch (error) { console.warn('Preferência visual não persistida:', error); }
        }

        function isSmallSidebar() { return window.matchMedia('(max-width: 1023px)').matches; }

        function updateSidebarButtons() {
            const isOpen = isSmallSidebar() ? document.body.classList.contains('sidebar-open') : document.body.classList.contains('sidebar-expanded');
            const toggle = document.getElementById('btn-sidebar-collapse');
            const mobile = document.getElementById('btn-sidebar-mobile');
            toggle.setAttribute('aria-expanded', String(isOpen));
            mobile.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', isOpen ? 'Recolher menu lateral' : 'Expandir menu lateral');
            toggle.title = isOpen ? 'Recolher menu lateral' : 'Expandir menu lateral';
        }

        function closeSidebar() {
            document.body.classList.remove('sidebar-open');
            updateSidebarButtons();
        }

        function toggleSidebar() {
            if (isSmallSidebar()) document.body.classList.toggle('sidebar-open');
            else document.body.classList.toggle('sidebar-expanded');
            updateSidebarButtons();
        }

        function openSettingsModal() {
            closeSidebar();
            const modal = document.getElementById('settings-modal');
            settingsReturnFocus = document.activeElement;
            modal.hidden = false;
            syncModalLayers();
            document.getElementById('btn-close-settings').focus();
        }

        function closeSettingsModal() {
            const modal = document.getElementById('settings-modal');
            if (modal.hidden) return;
            modal.hidden = true;
            syncModalLayers();
            settingsReturnFocus?.focus?.();
            settingsReturnFocus = null;
        }

        /** Mantém dock e sidebar com a mesma etapa ativa, inclusive ao abrir um expander diretamente. */
        function syncWorkspaceNavigation() {
            const opened = [...document.querySelectorAll('#inspection-workspace .expander-card.is-open')]
                .find(card => card.id !== 'print-photo-section');
            const activeId = opened
                ? (opened.closest('#checklist-sections') ? 'checklist-sections' : opened.id)
                : null;
            document.querySelectorAll('[data-go]').forEach(button => {
                const isActive = Boolean(activeId && button.dataset.go === activeId);
                button.classList.toggle('is-active', isActive);
                if (isActive) button.setAttribute('aria-current', 'location');
                else button.removeAttribute('aria-current');
            });
        }

        function navigateWorkspaceTo(id) {
            const target = id === 'checklist-sections'
                ? document.querySelector('#checklist-sections .expander-card')
                : document.getElementById(id);
            if (!target) return;
            if (target.classList.contains('expander-card')) toggleExpander(target.id, true);
            closeSidebar();
            syncWorkspaceNavigation();
            requestAnimationFrame(() => target.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start'
            }));
        }

        function setupWorkspaceUI() {
            let stored = 'columns';
            try { stored = localStorage.getItem(UI_LAYOUT_KEY) || 'columns'; }
            catch (error) { console.warn('Preferência visual indisponível:', error); }
            setWorkspaceLayout(stored);

            const actionSheet = document.getElementById('mobile-actions-sheet');
            const actionSheetTrigger = document.getElementById('btn-mobile-actions');
            const closeActionSheet = () => {
                actionSheet.hidden = true;
                actionSheetTrigger.setAttribute('aria-expanded', 'false');
            };
            actionSheetTrigger.addEventListener('click', () => {
                const open = actionSheet.hidden;
                actionSheet.hidden = !open;
                actionSheetTrigger.setAttribute('aria-expanded', String(open));
                if (open) actionSheet.querySelector('[data-action-target]')?.focus();
            });
            actionSheet.querySelectorAll('[data-action-target]').forEach(button => {
                button.addEventListener('click', () => {
                    closeActionSheet();
                    document.getElementById(button.dataset.actionTarget)?.click();
                });
            });
            document.getElementById('btn-close-actions').addEventListener('click', () => { closeActionSheet(); actionSheetTrigger.focus(); });
            actionSheet.addEventListener('click', event => { if (event.target === actionSheet) closeActionSheet(); });
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && !actionSheet.hidden) { closeActionSheet(); actionSheetTrigger.focus(); }
            });
            document.getElementById('btn-sidebar-mobile').addEventListener('click', toggleSidebar);
            document.getElementById('btn-sidebar-collapse').addEventListener('click', toggleSidebar);
            document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);
            window.addEventListener('resize', () => {
                if (!isSmallSidebar()) closeSidebar();
                updateSidebarButtons();
            });
            document.querySelectorAll('[data-go]').forEach(button => {
                button.addEventListener('click', () => navigateWorkspaceTo(button.dataset.go));
            });
            document.querySelectorAll('[data-command]').forEach(button => {
                button.addEventListener('click', () => {
                    const command = button.dataset.command;
                    closeSidebar();
                    if (command === 'history') openHistoryModal();
                    else if (command === 'print') validateAndPrint();
                    else if (command === 'settings') openSettingsModal();
                });
            });
            document.getElementById('btn-layout-columns').addEventListener('click', () => setWorkspaceLayout('columns'));
            document.getElementById('btn-layout-list').addEventListener('click', () => setWorkspaceLayout('list'));
            document.querySelectorAll('[data-layout]').forEach(button => {
                button.addEventListener('click', () => setWorkspaceLayout(button.dataset.layout));
            });
            document.getElementById('btn-settings-sidebar').addEventListener('click', () => {
                closeSettingsModal();
                toggleSidebar();
            });
            document.getElementById('btn-close-settings').addEventListener('click', closeSettingsModal);
            document.getElementById('settings-modal').addEventListener('click', event => {
                if (event.target.id === 'settings-modal') closeSettingsModal();
            });
            updateSidebarButtons();
            syncWorkspaceNavigation();
        }

        let confirmReturnFocus = null;
        /** Hierarquia explícita: a última confirmação sempre fica acima do histórico. */
        function syncModalLayers() {
            const confirmationVisible = !document.getElementById('confirm-modal').classList.contains('hidden');
            const history = document.getElementById('history-modal');
            history.inert = confirmationVisible;
            const settings = document.getElementById('settings-modal');
            settings.inert = confirmationVisible;
            const hasActive = confirmationVisible || !history.classList.contains('hidden') || !settings.hidden;
            document.body.classList.toggle('modal-lock', hasActive);
        }
        function openConfirmModal(title, descHtml, onConfirm, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar') {
            const modal = document.getElementById('confirm-modal');
            confirmReturnFocus = document.activeElement;
            document.getElementById('modal-title').textContent = title;
            // Texto de confirmação produzido exclusivamente pela aplicação.
            document.getElementById('modal-desc').innerHTML = descHtml;
            const confirmButton = document.getElementById('modal-confirm');
            const cancelButton = document.getElementById('modal-cancel');
            confirmButton.textContent = confirmLabel;
            cancelButton.textContent = cancelLabel;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            syncModalLayers();
            const close = () => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                syncModalLayers();
                const focusTarget = confirmReturnFocus;
                confirmReturnFocus = null;
                if (focusTarget?.isConnected && !focusTarget.closest('[hidden]')) focusTarget.focus();
            };
            cancelButton.onclick = close;
            confirmButton.onclick = () => {
                close();
                Promise.resolve().then(onConfirm).catch(error => {
                    console.error('Falha na operação confirmada:', error);
                    showToast('Não foi possível concluir esta operação.');
                });
            };
            cancelButton.focus();
        }

        function setupModalAccessibility() {
            document.addEventListener('keydown', event => {
                const modal = ['confirm-modal','settings-modal','history-modal'].map(id => document.getElementById(id)).find(el => !el.classList.contains('hidden') && !el.hidden);
                if (!modal) {
                    if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
                        event.preventDefault();
                        closeSidebar();
                        document.getElementById('btn-sidebar-mobile').focus();
                    }
                    return;
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    if (modal.id === 'history-modal') closeHistoryModal();
                    else if (modal.id === 'settings-modal') closeSettingsModal();
                    else document.getElementById('modal-cancel').click();
                }
                if (event.key === 'Tab') {
                    const nodes = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])')].filter(el => el.getClientRects().length);
                    if (!nodes.length) return;
                    const first = nodes[0], last = nodes[nodes.length - 1];
                    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
                    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
                }
            });
            document.getElementById('history-modal').addEventListener('click', event => { if (event.target.id === 'history-modal') closeHistoryModal(); });
            document.getElementById('confirm-modal').addEventListener('click', event => { if (event.target.id === 'confirm-modal') document.getElementById('modal-cancel').click(); });
        }


                /**
         * 12. PERSISTÊNCIA OFFLINE NO LOCALSTORAGE (COM MIGRAÇÃO RETROCOMPATÍVEL)
         */
        // IndexedDB guarda fotos/histórico sem o limite rígido de ~5 MB do localStorage.
        // localStorage continua como rascunho de recuperação e para migração v2/v3.
        const DB_NAME = 'vistoria_veicular_offline';
        const DB_STORE = 'documents';
        let database = null;
        let historyCache = [];
        let saveTimeout = null;
        let saveInFlight = Promise.resolve();
        let saveVersion = 0;

        function dbGet(key) {
            return new Promise((resolve, reject) => {
                if (!database) return resolve(null);
                const tx = database.transaction(DB_STORE, 'readonly');
                const request = tx.objectStore(DB_STORE).get(key);
                request.onsuccess = () => resolve(request.result ?? null);
                request.onerror = () => reject(request.error);
            });
        }
        function dbPut(key, value) {
            return new Promise((resolve, reject) => {
                if (!database) return resolve(false);
                const tx = database.transaction(DB_STORE, 'readwrite');
                tx.objectStore(DB_STORE).put(value, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            });
        }
        async function loadPersistence() {
            let legacy = null;
            try {
                const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
                if (raw) legacy = normalizeState(JSON.parse(raw));
            } catch (err) {console.warn('Rascunho antigo inválido:', err);}
            try {
                historyCache = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
                if (!Array.isArray(historyCache)) historyCache = [];
                historyCache = historyCache.slice(0, 500).map(entry => {try {return normalizeHistoryEntry(entry);} catch {return null;}}).filter(Boolean);
            } catch {historyCache = [];}
            if (legacy) appState = legacy;
            if ('indexedDB' in window) {
                try {
                    database = await new Promise((resolve, reject) => {
                        const req = indexedDB.open(DB_NAME, 1);
                        req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                        req.onblocked = () => reject(new Error('Banco ocupado em outra aba'));
                    });
                    const stored = await dbGet('current');
                    if (stored) {
                        const snapshot = normalizeState(stored);
                        // Migração nunca descarta um rascunho mais recente salvo na versão anterior.
                        if (!legacy || String(snapshot.meta.updatedAt) >= String(legacy.meta.updatedAt)) appState = snapshot;
                        else await dbPut('current', legacy);
                    } else if (legacy) await dbPut('current', legacy);
                    const archive = await dbGet('history');
                    if (Array.isArray(archive)) historyCache = archive.map(entry => {try{return normalizeHistoryEntry(entry);}catch{return null;}}).filter(Boolean);
                    else if (historyCache.length) await dbPut('history', historyCache);
                } catch (err) {
                    console.warn('IndexedDB indisponível; usando armazenamento local:', err);
                    database = null;
                }
            }
        }
        function lightweightSnapshot(snapshot) {
            const basic = JSON.parse(JSON.stringify(snapshot));
            for (const entry of Object.values(basic.checklist)) entry.photo = null;
            for (const pin of basic.pins) pin.photo = null;
            // Assinaturas são pequenas e permanecem no rascunho de segurança.
            return basic;
        }
        function setSaveStatus(label, level = 'ok') {
            const dot = document.getElementById('save-status-dot');
            const labelEl = document.getElementById('save-status-text');
            dot.classList.remove('bg-emerald-500', 'bg-amber-400', 'bg-rose-500');
            dot.classList.add(level === 'ok' ? 'bg-emerald-500' : level === 'pending' ? 'bg-amber-400' : 'bg-rose-500');
            labelEl.textContent = label;
        }
        function saveToLocalStorage() {
            setSaveStatus('Salvando...', 'pending');
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(flushSave, 350);
        }
        function flushSave() {
            clearTimeout(saveTimeout);
            saveTimeout = null;
            appState.meta.updatedAt = new Date().toISOString();
            const snapshot = JSON.parse(JSON.stringify(appState));
            const version = ++saveVersion;
            let localSaved = false;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(database ? lightweightSnapshot(snapshot) : snapshot));
                localSaved = true;
            } catch (err) {
                console.warn('Quota localStorage:', err);
                try {localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightSnapshot(snapshot))); localSaved = true;} catch {}
            }
            saveInFlight = saveInFlight.catch(() => {}).then(async () => {
                try {
                    const dbSaved = await dbPut('current', snapshot);
                    if (version === saveVersion) setSaveStatus(dbSaved || localSaved ? 'Salvo neste dispositivo' : 'Falha ao salvar', dbSaved || localSaved ? 'ok' : 'error');
                } catch (err) {
                    console.warn('Erro ao salvar offline:', err);
                    if (version === saveVersion) setSaveStatus(localSaved ? 'Salvo sem fotos no backup' : 'Falha ao salvar', localSaved ? 'pending' : 'error');
                }
            });
            return saveInFlight;
        }

        function normalizeHistoryEntry(entry) {
            const saved = normalizeState(entry);
            if (!saved.meta.archiveId) saved.meta.archiveId = generateHistoryEntryId();
            return saved;
        }

        function getHistoryList() {return historyCache;}
        async function saveHistoryList(list) {
            const normalized = JSON.parse(JSON.stringify(list));
            try {
                if (database) {
                    const saved = await dbPut('history', normalized);
                    if (!saved) throw new Error('Sem armazenamento disponível');
                } else {
                    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(normalized));
                }
                historyCache = normalized;
                updateHistoryCounterBadge();
                return true;
            } catch (error) {
                console.warn('Histórico não foi salvo:', error);
                return false;
            }
        }

        let toastTimeout = null;
                function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-message').textContent = msg;
            toast.classList.remove('translate-y-24', 'sm:translate-x-full', 'opacity-0');
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toast.classList.add('translate-y-24', 'sm:translate-x-full', 'opacity-0');
            }, 3200);
        }
    
