checkAuth(); 

class AvaliacoesManager {
    constructor() {
        console.log('Iniciando AvaliacoesManager');
        this.avaliacoes = [];
        this.isMaster = sessionStorage.getItem('isMaster') === 'true';
        this.setupEventListeners();
        this.carregarAvaliacoes();
        this.configurarBotoesAdmin();
        this.setCourseLogo();
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
        
        // Se não for master, esconde os botões de limpar
        if (!this.isMaster) {
            limparAvaliacoesBtn?.remove();
            limparVisitantesBtn?.remove();
        }
    }

    setupEventListeners() {
        // Pesquisa
        document.getElementById('pesquisa').addEventListener('input', (e) => {
            this.filtrarAvaliacoes(e.target.value);
        });

        // Filtro por nota
        document.getElementById('filtroNota').addEventListener('change', (e) => {
            this.filtrarPorNota(e.target.value);
        });
    }

    calcularEstatisticas() {
        if (this.avaliacoes.length === 0) return {
            mediaGeral: 0,
            total: 0,
            mediaCriatividade: 0,
            mediaProjetos: 0,
            mediaInteratividade: 0
        };

        let totalValido = 0;
        const soma = this.avaliacoes.reduce((acc, av) => {
            if (av.criatividade && av.projetos && av.interatividade) {
                totalValido++;
                return {
                    criatividade: acc.criatividade + Number(av.criatividade),
                    projetos: acc.projetos + Number(av.projetos),
                    interatividade: acc.interatividade + Number(av.interatividade)
                };
            }
            return acc;
        }, { criatividade: 0, projetos: 0, interatividade: 0 });

        if (totalValido === 0) return {
            mediaGeral: 0,
            total: 0,
            mediaCriatividade: 0,
            mediaProjetos: 0,
            mediaInteratividade: 0
        };

        return {
            mediaGeral: ((soma.criatividade + soma.projetos + soma.interatividade) / (totalValido * 3)).toFixed(1),
            total: totalValido,
            mediaCriatividade: (soma.criatividade / totalValido).toFixed(1),
            mediaProjetos: (soma.projetos / totalValido).toFixed(1),
            mediaInteratividade: (soma.interatividade / totalValido).toFixed(1)
        };
    }

    atualizarEstatisticas() {
        const stats = this.calcularEstatisticas();
        
        document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = stats.mediaGeral;
        document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = stats.total;
        document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = stats.mediaCriatividade;
        document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = stats.mediaProjetos;
    }

    criarEstrelas(nota) {
        const numeroNota = parseInt(nota);
        if (isNaN(numeroNota) || numeroNota < 1 || numeroNota > 5) {
            return '☆☆☆☆☆';
        }
        const estrelasPreenchidas = '★'.repeat(numeroNota);
        const estrelasVazias = '☆'.repeat(5 - numeroNota);
        return estrelasPreenchidas + estrelasVazias;
    }

    formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderizarAvaliacoes(avaliacoesArray) {
        const container = document.querySelector('.avaliacoes-list');
        container.innerHTML = '';

        avaliacoesArray.forEach(avaliacao => {
            const avaliacaoElement = this.renderizarAvaliacao(avaliacao);
            container.appendChild(avaliacaoElement);
        });
    }

    filtrarAvaliacoes(termo) {
        termo = termo.toLowerCase();
        const filtradas = this.avaliacoes.filter(av => 
            av.nome.toLowerCase().includes(termo) || 
            av.comentarios.toLowerCase().includes(termo)
        );
        this.renderizarAvaliacoes(filtradas);
    }

    filtrarPorNota(nota) {
        nota = parseInt(nota);
        const filtradas = nota ? 
            this.avaliacoes.filter(av => 
                Number(av.criatividade) === nota || 
                Number(av.projetos) === nota || 
                Number(av.interatividade) === nota
            ) : this.avaliacoes;
        this.renderizarAvaliacoes(filtradas);
    }

    renderizarDashboard() {
        this.atualizarEstatisticas();
        this.renderizarAvaliacoes(this.avaliacoes);
    }

    carregarAvaliacoes() {
        console.log('Tentando carregar avaliações');
        const userCourse = sessionStorage.getItem('userCourse');
        const isMaster = sessionStorage.getItem('isMaster') === 'true';
        
        if (isMaster) {
            // Se for master, carrega todas as avaliações
            db.ref('avaliacoes').on('value', (snapshot) => {
                console.log('Dados recebidos:', snapshot.val());
                this.avaliacoes = [];
                snapshot.forEach((child) => {
                    this.avaliacoes.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                console.log('Avaliações processadas:', this.avaliacoes);
                this.renderizarDashboard();
            }, (error) => {
                console.error('Erro ao carregar:', error);
            });
        } else {
            // Se não for master, filtra pelo curso
            db.ref('avaliacoes')
                .orderByChild('curso')
                .equalTo(userCourse)
                .on('value', (snapshot) => {
                    console.log('Dados recebidos:', snapshot.val());
                    this.avaliacoes = [];
                    snapshot.forEach((child) => {
                        this.avaliacoes.push({
                            id: child.key,
                            ...child.val()
                        });
                    });
                    console.log('Avaliações processadas:', this.avaliacoes);
                    this.renderizarDashboard();
                }, (error) => {
                    console.error('Erro ao carregar:', error);
                });
        }
    }

    async limparAvaliacoes() {
        if (!this.isMaster) {
            alert('Você não tem permissão para realizar esta ação.');
            return;
        }

        if (!confirm('Tem certeza que deseja limpar todas as avaliações? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await db.ref('avaliacoes').remove();
            alert('Todas as avaliações foram removidas com sucesso!');
            this.renderizarDashboard();
        } catch (error) {
            console.error('Erro ao limpar avaliações:', error);
            alert('Erro ao limpar avaliações: ' + error.message);
        }
    }

    renderizarAvaliacao(avaliacao) {
        const template = document.getElementById('avaliacao-template');
        const clone = template.content.cloneNode(true);
        
        // Dados básicos
        clone.querySelector('.nome-usuario').textContent = avaliacao.nome || 'Anônimo';
        clone.querySelector('.data-avaliacao').textContent = this.formatarData(avaliacao.data);
        
        // Renderizar estrelas para cada critério
        const notasItems = clone.querySelectorAll('.nota-item .estrelas');
        
        // Criatividade
        if (notasItems[0]) {
            notasItems[0].textContent = this.criarEstrelas(avaliacao.criatividade);
        }
        
        // Projetos
        if (notasItems[1]) {
            notasItems[1].textContent = this.criarEstrelas(avaliacao.projetos);
        }
        
        // Interatividade
        if (notasItems[2]) {
            notasItems[2].textContent = this.criarEstrelas(avaliacao.interatividade);
        }
        
        // Comentário
        clone.querySelector('.comentario').textContent = avaliacao.comentarios || '';
        
        return clone;
    }
}

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.avaliacoesManager = new AvaliacoesManager();
});

// Função global que será chamada pelo botão
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

// Função para exportar CSV
async function exportarCSV() {
    try {
        // Busca os dados do Firebase
        const snapshot = await db.ref('avaliacoes').once('value');
        const avaliacoes = [];
        
        snapshot.forEach((child) => {
            avaliacoes.push({
                id: child.key,
                ...child.val()
            });
        });

        // Cria o cabeçalho do CSV
        let csv = 'Nome,Data,Criatividade,Projetos,Interatividade,Comentários\n';
        
        // Adiciona cada avaliação ao CSV
        avaliacoes.forEach(av => {
            const linha = [
                `"${av.nome || 'Anônimo'}"`,
                `"${new Date(av.data).toLocaleString('pt-BR')}"`,
                av.criatividade,
                av.projetos,
                av.interatividade,
                `"${(av.comentarios || '').replace(/"/g, '""')}"` // Escapa aspas duplas nos comentários
            ].join(',');
            
            csv += linha + '\n';
        });

        // Cria e faz o download do arquivo
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `avaliacoes_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao exportar avaliações: ' + error.message);
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

        // Escutar por novas mensagens
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

// Inicializar o chat
document.addEventListener('DOMContentLoaded', () => {
    window.chatWidget = new ChatWidget();
});

class AdminDashboard {
    constructor() {
        this.visitorCounter = new VisitorCounter();
        this.setupDashboard();
    }

    async setupDashboard() {
        // Configurar contador de visitantes
        this.visitorCounter.setupAdminCounter();

        // Obter estatísticas detalhadas
        const stats = await this.visitorCounter.getVisitorStats();
        if (stats) {
            this.updateVisitorStats(stats);
        }
    }

    updateVisitorStats(stats) {
        // Atualizar estatísticas adicionais se necessário
        console.log('Total de visitantes:', stats.total);
        // Você pode adicionar mais visualizações de dados aqui
    }
}

// Inicializar o dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AdminDashboard();
});

function voltarLogin() {
    window.location.href = 'login.html';
} 