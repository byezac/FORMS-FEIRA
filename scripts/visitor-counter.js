class VisitorCounter {
    constructor() {
        this.visitorRef = db.ref('visitors');
        this.today = new Date().toISOString().split('T')[0];
    }

    // Incrementa o contador quando alguém acessa a página principal
    async incrementVisitor() {
        try {
            console.log('Incrementando visitante para:', this.today);
            const todayRef = this.visitorRef.child(this.today);
            
            await todayRef.transaction((currentCount) => {
                console.log('Contagem atual:', currentCount);
                return (currentCount || 0) + 1;
            });
            
            console.log('Visitante incrementado com sucesso');
        } catch (error) {
            console.error('Erro ao incrementar visitantes:', error);
        }
    }

    // Configura o contador no painel admin
    setupAdminCounter() {
        console.log('Configurando contador admin');
        this.visitorRef.child(this.today).on('value', (snapshot) => {
            const count = snapshot.val() || 0;
            console.log('Contagem de visitantes hoje:', count);
            const countElement = document.getElementById('visitorCount');
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    async clearVisitors() {
        try {
            await this.visitorRef.remove();
            const countElement = document.getElementById('visitorCount');
            if (countElement) {
                countElement.textContent = '0';
            }
            return true;
        } catch (error) {
            console.error('Erro ao limpar visitantes:', error);
            return false;
        }
    }
}

// Função global para limpar visitantes
async function limparVisitantes() {
    if (!confirm('Tem certeza que deseja limpar todos os registros de visitantes? Esta ação não pode ser desfeita.')) {
        return;
    }

    const counter = new VisitorCounter();
    const success = await counter.clearVisitors();
    
    if (success) {
        alert('Registros de visitantes removidos com sucesso!');
    } else {
        alert('Erro ao remover registros de visitantes. Verifique o console para mais detalhes.');
    }
}

// Inicializar o contador
document.addEventListener('DOMContentLoaded', () => {
    const counter = new VisitorCounter();
    
    // Se estiver na página principal, incrementa o contador
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname === '') {
        console.log('Página principal detectada, incrementando visitante');
        counter.incrementVisitor();
    }

    // Se estiver na página admin, configura o display do contador
    if (window.location.pathname.includes('admin.html')) {
        console.log('Página admin detectada, configurando contador');
        counter.setupAdminCounter();
    }
}); 