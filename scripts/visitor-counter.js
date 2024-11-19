class VisitorCounter {
    constructor() {
        this.visitorsRef = firebase.database().ref('visitors');
    }

    async incrementVisitorCount() {
        try {
            const snapshot = await this.visitorsRef.once('value');
            const currentCount = parseInt(snapshot.val()) || 0;
            await this.visitorsRef.set(currentCount + 1);
            console.log('Contador incrementado:', currentCount + 1);
        } catch (error) {
            console.error('Erro ao incrementar visitantes:', error);
        }
    }

    async getVisitorCount() {
        try {
            const snapshot = await this.visitorsRef.once('value');
            return parseInt(snapshot.val()) || 0;
        } catch (error) {
            console.error('Erro ao obter contagem de visitantes:', error);
            return 0;
        }
    }

    setupAdminCounter() {
        this.visitorsRef.on('value', (snapshot) => {
            const count = parseInt(snapshot.val()) || 0;
            const visitorCountElement = document.querySelector('.visitor-count');
            if (visitorCountElement) {
                visitorCountElement.textContent = count.toString();
            }
        });
    }
}

// Inicializar o contador quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const counter = new VisitorCounter();
    // Incrementa apenas na página inicial
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        counter.incrementVisitorCount();
    }
}); 