// O URL da sua Aplicação Web Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwVtBTXSVQewaPyGmCQP4x2VZ4MEYAv6UXKeHNEZKm7KH9UDVG0PaD8vKiGIPSipjtHQ/exec';

// =========================================================================
// LÓGICA DE LEITURA (Página index.html)
// =========================================================================

function carregarProdutos() {
    const listaProdutos = document.getElementById('lista-produtos');
    if (!listaProdutos) return; // Se não estiver na página de produtos, sai

    fetch(SCRIPT_URL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        listaProdutos.innerHTML = ''; // Limpa a mensagem "A carregar produtos..."

        if (data.status === 'ERROR') {
            listaProdutos.innerHTML = `<p style="color: red;">Erro ao carregar dados: ${data.message}</p>`;
            console.error('Apps Script Error:', data.message);
            return;
        }

        const produtos = data.data;

        if (!produtos || produtos.length === 0) {
            listaProdutos.innerHTML = '<p>Neste momento, não temos produtos disponíveis.</p>';
            return;
        }

        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            
            // Assume as chaves dos objetos JSON retornados pelo doGet: Nome, Preço, Descrição, Stock
            const nome = produto.Nome || 'Produto Sem Nome';
            const preco = produto.Preço ? `€ ${produto.Preço.toFixed(2)}` : 'N/A';
            const descricao = produto.Descrição || 'Sem descrição.';
            const stock = produto.Stock || 0;

            card.innerHTML = `
                <h3>${nome}</h3>
                <p><strong>Preço:</strong> ${preco}</p>
                <p>${descricao}</p>
                <p><strong>Stock:</strong> ${stock}</p>
                <button onclick="window.location.href='encomenda.html?produto=${encodeURIComponent(nome)}'">Encomendar</button>
            `;

            listaProdutos.appendChild(card);
        });
    })
    .catch(error => {
        listaProdutos.innerHTML = `<p style="color: red;">Não foi possível ligar ao catálogo: ${error.message}</p>`;
        console.error('Fetch Error:', error);
    });
}

// =========================================================================
// LÓGICA DE ESCRITA (Página encomenda.html)
// =========================================================================

function submeterEncomenda(event) {
    const form = document.getElementById('form-encomenda');
    if (!form) return;
    
    event.preventDefault(); // Impede o comportamento padrão de submissão do formulário

    const submitButton = document.getElementById('submit-button');
    const feedbackMessage = document.getElementById('feedback-message');
    
    submitButton.disabled = true;
    submitButton.textContent = 'A processar...';
    feedbackMessage.style.color = 'blue';
    feedbackMessage.textContent = 'A enviar encomenda para o sistema...';

    // Cria um objeto com os dados do formulário
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
        // As chaves devem corresponder EXATAMENTE aos cabeçalhos da folha 'Encomendas'
        payload[key] = value; 
    });

    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        submitButton.disabled = false;
        submitButton.textContent = 'Submeter Encomenda';

        if (data.status === 'SUCCESS') {
            feedbackMessage.style.color = 'green';
            feedbackMessage.textContent = data.message || 'Encomenda registada com sucesso!';
            form.reset(); // Limpa o formulário após o sucesso
        } else {
            feedbackMessage.style.color = 'red';
            feedbackMessage.textContent = data.message || 'Erro desconhecido ao registar encomenda.';
            console.error('Apps Script Error:', data.message);
        }
    })
    .catch(error => {
        submitButton.disabled = false;
        submitButton.textContent = 'Submeter Encomenda';
        feedbackMessage.style.color = 'red';
        feedbackMessage.textContent = `Falha na comunicação com o servidor: ${error.message}`;
        console.error('Fetch Error:', error);
    });
}

// Função para pré-preencher o campo 'Produto' se vier de um link
function preencherProduto() {
    const urlParams = new URLSearchParams(window.location.search);
    const produto = urlParams.get('produto');
    const inputProduto = document.getElementById('Produto');

    if (produto && inputProduto) {
        inputProduto.value = decodeURIComponent(produto);
    }
}


// =========================================================================
// INICIALIZAÇÃO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Catálogo de Produtos
    carregarProdutos();

    // 2. Formulário de Encomenda
    const form = document.getElementById('form-encomenda');
    if (form) {
        preencherProduto(); // Tenta pré-preencher o campo de produto
        form.addEventListener('submit', submeterEncomenda);
    }
});
