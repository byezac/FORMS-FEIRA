checkAuth(); 

class AvaliacoesManager {
    constructor() {
        console.log('Iniciando AvaliacoesManager');
        this.avaliacoes = [];
        this.isMaster = sessionStorage.getItem('isMaster') === 'true';
        this.userCourse = sessionStorage.getItem('userCourse');
        this.carregarAvaliacoes();
        this.configurarBotoesAdmin();
        this.setCourseLogo();
        this.setupEventListeners();
    }

    setCourseLogo() {
        const userCourse = sessionStorage.getItem('userCourse');
        const logoElement = document.getElementById('courseLogo');
        
        const logoMap = {
            'administracao': 'logo/adm.jpg',
            'agricultura': 'logo/agri.jpg',
            'agroindustria': 'logo/agroind.jpg',
            'agropecuaria': 'logo/agrop.jpg',
            'mineracao': 'logo/mine.jpg',
            'multimidia': 'logo/multi.jpg',
            'recursoshumanos': 'logo/rh.jpg',
            'master': 'img/eetepa-Xinguara-2.ico'
        };

        if (logoElement && logoMap[userCourse]) {
            logoElement.src = logoMap[userCourse];
            logoElement.alt = `Logo ${userCourse}`;
        }
    }

    configurarBotoesAdmin() {
        const limparAvaliacoesBtn = document.querySelector('.clear-btn');
        const limparVisitantesBtn = document.querySelector('.clear-btn.danger');
        const exportBtn = document.querySelector('.export-btn');
        const visitorsCard = document.querySelector('.visitors-card');
        
        if (!this.isMaster) {
            limparAvaliacoesBtn?.remove();
            limparVisitantesBtn?.remove();
            visitorsCard?.remove();
        } else {
            if (visitorsCard) {
                visitorsCard.style.display = 'block';
                const counter = new VisitorCounter();
                counter.setupAdminCounter();
            }
        }
    }

    async carregarAvaliacoes() {
        try {
            console.log('Carregando avaliações...');
            console.log('Curso do usuário:', this.userCourse);
            console.log('É master?', this.isMaster);

            const snapshot = await db.ref('avaliacoes').once('value');
            this.avaliacoes = [];

            snapshot.forEach(childSnapshot => {
                const avaliacao = childSnapshot.val();
                console.log('Avaliação encontrada:', avaliacao);
                
                if (this.isMaster || avaliacao.curso === this.userCourse) {
                    this.avaliacoes.push({
                        id: childSnapshot.key,
                        ...avaliacao
                    });
                }
            });

            console.log('Total de avaliações carregadas:', this.avaliacoes.length);
            this.atualizarEstatisticas();
            this.renderizarAvaliacoes();
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        }
    }

    renderizarAvaliacoes() {
        const container = document.querySelector('.avaliacoes-list');
        if (!container) {
            console.error('Container de avaliações não encontrado');
            return;
        }

        container.innerHTML = '';
        
        this.avaliacoes
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(avaliacao => {
                const avaliacaoElement = this.renderizarAvaliacao(avaliacao);
                container.appendChild(avaliacaoElement);
            });
    }

    renderizarAvaliacao(avaliacao) {
        const template = document.getElementById('avaliacao-template');
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.nome-usuario').textContent = avaliacao.nome || 'Anônimo';
        clone.querySelector('.data-avaliacao').textContent = this.formatarData(avaliacao.data);
        
        const cursoInfo = clone.querySelector('.curso-info');
        if (this.isMaster && cursoInfo) {
            cursoInfo.style.display = 'block';
            const cursosMap = {
                'administracao': 'Administração',
                'agricultura': 'Agricultura',
                'agroindustria': 'Agroindústria',
                'agropecuaria': 'Agropecuária',
                'mineracao': 'Mineração',
                'multimidia': 'Multimídia',
                'recursoshumanos': 'Recursos Humanos'
            };
            cursoInfo.textContent = `Curso: ${cursosMap[avaliacao.curso] || avaliacao.curso}`;
        }

        const estrelas = clone.querySelectorAll('.estrelas');
        estrelas[0].textContent = this.criarEstrelas(avaliacao.criatividade);
        estrelas[1].textContent = this.criarEstrelas(avaliacao.projetos);
        estrelas[2].textContent = this.criarEstrelas(avaliacao.interatividade);
        
        clone.querySelector('.comentario').textContent = avaliacao.comentarios || '';
        
        return clone;
    }

    atualizarEstatisticas() {
        if (this.avaliacoes.length === 0) return;

        const calcularMedia = (criterio) => {
            const soma = this.avaliacoes.reduce((acc, av) => acc + (av[criterio] || 0), 0);
            return (soma / this.avaliacoes.length).toFixed(1);
        };

        document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
            calcularMedia('criatividade');
        
        document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
            this.avaliacoes.length;
        
        document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = 
            calcularMedia('criatividade');
        
        document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = 
            calcularMedia('projetos');
        
        document.querySelector('.stat-card:nth-child(5) .stat-number').textContent = 
            calcularMedia('interatividade');
    }

    criarEstrelas(nota) {
        return '★'.repeat(nota) + '☆'.repeat(5 - nota);
    }

    formatarData(dataString) {
        if (!dataString) return '';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderizarDashboard() {
        this.atualizarEstatisticas();
        this.renderizarAvaliacoes(this.avaliacoes);
    }

    async limparAvaliacoes() {
        const isMaster = sessionStorage.getItem('isMaster') === 'true';
        
        if (!isMaster) {
            Swal.fire({
                title: 'Erro!',
                text: 'Você não tem permissão para realizar esta ação.',
                icon: 'error',
                timer: 1500,
                showConfirmButton: false,
                position: 'center'
            });
            return;
        }

        try {
            const result = await Swal.fire({
                title: 'Tem certeza?',
                text: "Você irá apagar todas as avaliações! Esta ação não pode ser desfeita.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sim, apagar!',
                cancelButtonText: 'Cancelar',
                position: 'center',
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false
            });

            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Apagando...',
                    text: 'Por favor, aguarde.',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                await db.ref('avaliacoes').remove();
                
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Todas as avaliações foram removidas!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    position: 'center'
                });

                const avaliacoesContainer = document.querySelector('.avaliacoes-list');
                if (avaliacoesContainer) {
                    avaliacoesContainer.innerHTML = '';
                }
                
                document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = '0.0';
                document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = '0';
                document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = '0.0';
                document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = '0.0';
                document.querySelector('.stat-card:nth-child(5) .stat-number').textContent = '0.0';
            }
        } catch (error) {
            console.error('Erro ao limpar avaliações:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao limpar avaliações: ' + error.message,
                icon: 'error',
                timer: 1500,
                showConfirmButton: false,
                position: 'center'
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.avaliacoesManager = new AvaliacoesManager();
});

async function limparAvaliacoes() {
    const isMaster = sessionStorage.getItem('isMaster') === 'true';
    
    if (!isMaster) {
        alert('Você não tem permissão para realizar esta ação.');
        return;
    }

    if (window.avaliacoesManager) {
        await window.avaliacoesManager.limparAvaliacoes();
    }
}

async function exportarCSV() {
    try {
        const result = await Swal.fire({
            title: 'Exportar dados?',
            text: "Você irá baixar todas as avaliações em formato Excel",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, exportar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const snapshot = await db.ref('avaliacoes').once('value');
            const avaliacoes = [];
            
            snapshot.forEach((child) => {
                avaliacoes.push({
                    id: child.key,
                    ...child.val()
                });
            });

            let csv = 'Nome,Data,Criatividade,Projetos,Interatividade,Comentários\n';
            
            avaliacoes.forEach(av => {
                const linha = [
                    `"${av.nome || 'Anônimo'}"`,
                    `"${new Date(av.data).toLocaleString('pt-BR')}"`,
                    av.criatividade,
                    av.projetos,
                    av.interatividade,
                    `"${(av.comentarios || '').replace(/"/g, '""')}"`
                ].join(',');
                
                csv += linha + '\n';
            });

            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `avaliacoes_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            Swal.fire({
                title: 'Sucesso!',
                text: 'Arquivo exportado com sucesso!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                position: 'center'
            });
        }
    } catch (error) {
        console.error('Erro ao exportar:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Erro ao exportar arquivo: ' + error.message,
            icon: 'error',
            timer: 1500,
            showConfirmButton: false,
            position: 'center'
        });
    }
}

class ChatWidget {
    constructor() {
        this.chatRef = db.ref('chat');
        this.setupEventListeners();
        this.currentUser = `user_${Math.random().toString(36).substr(2, 9)}`;
    }

    setupEventListeners() {
        const chatTrigger = document.getElementById('chatTrigger');
        const closeChat = document.getElementById('closeChat');
        const sendMessage = document.getElementById('sendMessage');
        const messageInput = document.getElementById('messageInput');

        chatTrigger.addEventListener('click', () => this.toggleChat());
        closeChat.addEventListener('click', () => this.toggleChat());
        sendMessage.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.chatRef.on('child_added', (snapshot) => {
            this.displayMessage(snapshot.val());
        });
    }

    toggleChat() {
        const container = document.getElementById('chatContainer');
        container.classList.toggle('hidden');
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message) {
            this.chatRef.push({
                text: message,
                userId: this.currentUser,
                timestamp: Date.now()
            });
            input.value = '';
        }
    }

    displayMessage(message) {
        const messagesDiv = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        
        messageElement.className = `chat-message ${
            message.userId === this.currentUser ? 'message-sent' : 'message-received'
        }`;
        
        messageElement.textContent = message.text;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatWidget = new ChatWidget();
});

class AdminDashboard {
    constructor() {
        this.visitorCounter = new VisitorCounter();
        this.setupDashboard();
    }

    async setupDashboard() {
        this.visitorCounter.setupAdminCounter();

        const stats = await this.visitorCounter.getVisitorStats();
        if (stats) {
            this.updateVisitorStats(stats);
        }
    }

    updateVisitorStats(stats) {
        console.log('Total de visitantes:', stats.total);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AdminDashboard();
});

function voltarLogin() {
    window.location.href = 'login.html';
}

async function limparVisitantes() {
    const isMaster = sessionStorage.getItem('isMaster') === 'true';
    
    if (!isMaster) {
        Swal.fire({
            title: 'Erro!',
            text: 'Você não tem permissão para realizar esta ação.',
            icon: 'error',
            timer: 1500,
            showConfirmButton: false,
            position: 'center'
        });
        return;
    }

    try {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Você irá zerar o contador de visitantes!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, zerar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const db = firebase.database();
            await db.ref('visitors').set(0);
            
            Swal.fire({
                title: 'Sucesso!',
                text: 'Contador de visitantes zerado!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                position: 'center'
            });

            const visitorCountElement = document.querySelector('.visitor-count');
            if (visitorCountElement) {
                visitorCountElement.textContent = '0';
            }
        }
    } catch (error) {
        console.error('Erro ao limpar visitantes:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Erro ao zerar contador de visitantes: ' + error.message,
            icon: 'error',
            timer: 1500,
            showConfirmButton: false,
            position: 'center'
        });
    }
} 