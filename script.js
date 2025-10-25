// O URL da sua Aplicação Web Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYcnafuWnw7XogJlinmwbV1H8pIsarUuYC9QTtrXyaonqBrSbHKq-7hI8nuP1h0JcI7Q/exec';

// =========================================================================
// LÓGICA DE LEITURA (Página index.html) - GET
// =========================================================================

async function carregarProdutos() {
    const listaProdutos = document.getElementById('lista-produtos');
    const loadingMessage = document.getElementById('loading-message');
    if (!listaProdutos) return; 

    if (loadingMessage) {
        loadingMessage.style.display = 'block';
        loadingMessage.textContent = 'A carregar produtos do catálogo...';
    }

    try {
        // Pedido GET: Acesso simples, Apps Script lida com CORS automaticamente
        const response = await fetch(SCRIPT_URL, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Dados recebidos do Apps Script (GET):', data); 

        if (loadingMessage) loadingMessage.style.display = 'none';

        if (data.status === 'ERROR') {
            listaProdutos.innerHTML = `<p style="color: red;">Erro do servidor: ${data.message}</p>`;
            return;
        }

        const produtos = data.data;

        if (!produtos || produtos.length === 0) {
            listaProdutos.innerHTML = '<p>Neste momento, não temos produtos disponíveis no catálogo.</p>';
            return;
        }

        listaProdutos.innerHTML = ''; 

        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            
            // As chaves devem corresponder EXATAMENTE aos cabeçalhos da folha "Produtos"
            const nome = produto.Nome || 'Produto Sem Nome';
            const preco = typeof produto.Preço === 'number' ? `€ ${produto.Preço.toFixed(2)}` : 'Preço Indisponível';
            const descricao = produto.Descrição || 'Sem descrição detalhada.';
            const stock = produto.Stock || 0; 

            card.innerHTML = `
                <h3>${nome}</h3>
                <p><strong>Preço:</strong> ${preco}</p>
                <p>${descricao}</p>
                <p><strong>Stock:</strong> ${stock} unidades</p>
                <button onclick="window.location.href='encomenda.html?produto=${encodeURIComponent(nome)}'">Encomendar Agora</button>
            `;

            listaProdutos.appendChild(card);
        });

    } catch (error) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        listaProdutos.innerHTML = `<p style="color: red;">Não foi possível carregar o catálogo. (${error.message})</p>`;
        console.error('Fetch Error:', error);
    }
}

// =========================================================================
// LÓGICA DE ESCRITA (Página encomenda.html) - POST
// =========================================================================

async function submeterEncomenda(event) {
    const form = document.getElementById('form-encomenda');
    if (!form) return;
    
    event.preventDefault();

    const submitButton = document.getElementById('submit-button');
    const feedbackMessage = document.getElementById('feedback-message');
    
    submitButton.disabled = true;
    submitButton.textContent = 'A processar encomenda...';
    feedbackMessage.style.color = 'blue';
    feedbackMessage.textContent = 'A enviar a sua encomenda. Por favor, aguarde...';

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
        // As chaves do payload DEVEM CORRESPONDER EXATAMENTE aos CABEÇALHOS da folha 'Encomendas'
        payload[key] = value; 
    });

    console.log('Payload da encomenda a ser enviado:', payload);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            // SOLUÇÃO CORS: Usar text/plain para evitar a requisição OPTIONS
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            body: JSON.stringify(payload) // Enviamos o JSON como texto puro
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Resposta do Apps Script (POST):', data);

        submitButton.disabled = false;
        submitButton.textContent = 'Submeter Encomenda';

        if (data.status === 'SUCCESS') {
            feedbackMessage.style.color = 'green';
            feedbackMessage.textContent = data.message || 'Encomenda registada com sucesso! Em breve entraremos em contacto.';
            form.reset(); 
            // Preenche novamente o campo do produto após o reset
            preencherProduto();
        } else {
            feedbackMessage.style.color = 'red';
            feedbackMessage.textContent = data.message || 'Erro desconhecido ao registar encomenda. Tente novamente.';
        }
    } catch (error) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submeter Encomenda';
        feedbackMessage.style.color = 'red';
        feedbackMessage.textContent = `Falha na comunicação com o servidor: ${error.message}`;
        console.error('Fetch Error:', error);
    }
}

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
    // Inicializa a leitura se estiver na página index.html
    if (document.getElementById('lista-produtos')) {
        carregarProdutos();
    }

    // Inicializa o formulário se estiver na página encomenda.html
    const form = document.getElementById('form-encomenda');
    if (form) {
        preencherProduto();
        form.addEventListener('submit', submeterEncomenda);
    }
});
