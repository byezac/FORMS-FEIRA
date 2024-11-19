document.getElementById('avaliacaoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Formulário submetido');

    try {
        const criatividade = document.querySelector('input[name="criatividade"]:checked');
        const projetos = document.querySelector('input[name="projetos"]:checked');
        const interatividade = document.querySelector('input[name="interatividade"]:checked');
        const curso = document.getElementById('curso').value;

        if (!criatividade || !projetos || !interatividade || !curso) {
            Swal.fire({
                title: 'Atenção!',
                text: 'Por favor, preencha todos os campos obrigatórios antes de enviar.',
                icon: 'warning',
                timer: 2000,
                showConfirmButton: false,
                position: 'center'
            });
            return;
        }

        const avaliacao = {
            nome: document.getElementById('nome').value || 'Anônimo',
            curso: curso,
            criatividade: Number(criatividade.value),
            projetos: Number(projetos.value),
            interatividade: Number(interatividade.value),
            comentarios: document.getElementById('comentarios').value,
            data: new Date().toISOString(),
            timestamp: Date.now()
        };

        console.log('Tentando salvar:', avaliacao);

        db.ref('avaliacoes').push(avaliacao)
            .then(() => {
                console.log('Salvo com sucesso!');
                this.reset();
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Avaliação enviada com sucesso!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    position: 'center'
                });
            })
            .catch(error => {
                console.error('Erro ao salvar:', error);
                Swal.fire({
                    title: 'Erro!',
                    text: 'Erro ao salvar avaliação: ' + error.message,
                    icon: 'error',
                    timer: 1500,
                    showConfirmButton: false,
                    position: 'center'
                });
            });

    } catch (error) {
        console.error('Erro no processo:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Erro no processo: ' + error.message,
            icon: 'error',
            timer: 1500,
            showConfirmButton: false,
            position: 'center'
        });
    }
});

function backupAvaliacoes() {
    const avaliacoes = localStorage.getItem('avaliacoes');
    if (avaliacoes) {
        const backup = {
            data: new Date().toISOString(),
            avaliacoes: JSON.parse(avaliacoes)
        };
        localStorage.setItem('avaliacoes_backup', JSON.stringify(backup));
    }
}

// Função para gerenciar a seleção das estrelas
function initializeStarRatings() {
    const ratingGroups = document.querySelectorAll('.rating-group');
    
    ratingGroups.forEach(group => {
        const stars = group.querySelectorAll('input[type="radio"]');
        const labels = group.querySelectorAll('label');
        
        // Adiciona evento de clique para cada label
        labels.forEach((label, index) => {
            label.addEventListener('click', () => {
                const value = 5 - index; // Inverte o índice para corresponder ao valor correto
                const name = stars[index].name;
                
                // Marca o input correspondente
                stars.forEach(star => {
                    if (star.value <= value && star.name === name) {
                        star.checked = true;
                    } else if (star.name === name) {
                        star.checked = false;
                    }
                });
            });
        });
    });
}

// Inicializa o sistema de rating quando o documento carregar
document.addEventListener('DOMContentLoaded', initializeStarRatings); 

function enviarAvaliacao() {
    const nome = document.getElementById('nome').value;
    const curso = document.getElementById('curso').value;
    const avaliacao = document.getElementById('avaliacao').value;
    
    if (!nome || !curso || !avaliacao) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    // Aqui você pode adaptar para salvar/enviar os dados incluindo o curso
}

document.getElementById('curso').addEventListener('change', function() {
    if (this.value === 'programacao') {
        window.location.href = 'https://avalia-es-feira.vercel.app';
    }
}); 