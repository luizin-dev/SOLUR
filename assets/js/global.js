/* =====================================================
   SOLUR — UTILITÁRIOS GLOBAIS
   Ícones, toast, badges, favoritos, busca, cards e menu
   ===================================================== */

/* ---------- ícones (SVG inline) ---------- */

const SOLUR_ICONE_BUSCA =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

const SOLUR_ICONE_SACOLA =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0v3H9V7Z"/></svg>';

const SOLUR_ICONE_CORACAO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.6-9.2-8.6C1.2 8.5 3 5 6.5 5c2 0 3.4 1.1 4.2 2.4h2.6C14.1 6.1 15.5 5 17.5 5 21 5 22.8 8.5 21.2 11.4 19 15.4 12 20 12 20Z"/></svg>';

const SOLUR_ICONE_MENU =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

/* ---------- toast ---------- */

function solurToast(mensagem, tipo) {
    let area = document.querySelector(".toast-area");

    if (!area) {
        area = document.createElement("div");
        area.className = "toast-area";
        document.body.appendChild(area);
    }

    const toast = document.createElement("div");
    toast.className = "toast" + (tipo === "erro" ? " erro" : "");
    toast.textContent = mensagem;
    area.appendChild(toast);

    setTimeout(function () {
        toast.style.transition = "0.4s";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(function () {
            toast.remove();
        }, 400);
    }, 2600);
}

/* ---------- favoritos ---------- */

function solurFavoritosObter() {
    try {
        const dados = JSON.parse(localStorage.getItem("solur_favoritos"));
        return Array.isArray(dados) ? dados : [];
    } catch (e) {
        return [];
    }
}

function solurFavoritoContem(id) {
    return solurFavoritosObter().indexOf(Number(id)) !== -1;
}

function solurFavoritoAlternar(id) {
    let favoritos = solurFavoritosObter();
    id = Number(id);

    const posicao = favoritos.indexOf(id);

    if (posicao === -1) {
        favoritos.push(id);
        solurToast("Adicionado aos favoritos.");
    } else {
        favoritos.splice(posicao, 1);
        solurToast("Removido dos favoritos.");
    }

    localStorage.setItem("solur_favoritos", JSON.stringify(favoritos));
    solurAtualizarBadges();
    solurSincronizarCoracoes();
    return posicao === -1;
}

function solurSincronizarCoracoes() {
    document.querySelectorAll("[data-favorito]").forEach(function (botao) {
        botao.classList.toggle("favorito", solurFavoritoContem(botao.dataset.favorito));
    });
}

/* ---------- badges do header ---------- */

function solurAtualizarBadges() {
    const badgeCarrinho = document.getElementById("badgeCarrinho");
    const badgeFavoritos = document.getElementById("badgeFavoritos");

    if (badgeCarrinho) {
        const qtd = carrinhoContagem();
        badgeCarrinho.textContent = qtd;
        badgeCarrinho.hidden = qtd === 0;
    }

    if (badgeFavoritos) {
        const qtd = solurFavoritosObter().length;
        badgeFavoritos.textContent = qtd;
        badgeFavoritos.hidden = qtd === 0;
    }
}

/* ---------- card de produto ---------- */

function solurCardProduto(produto) {
    const desconto = solurDescontoPercentual(produto);

    let selo = "";
    if (desconto > 0) {
        selo = '<span class="selo">-' + desconto + "%</span>";
    } else if (produto.novo) {
        selo = '<span class="selo selo-novo">NOVO</span>';
    }

    return (
        '<article class="produto" data-id="' + produto.id + '">' +
        '<div class="produto-imagem">' +
        selo +
        '<button class="favoritar" data-favorito="' + produto.id + '" aria-label="Favoritar ' + produto.nome + '">' +
        SOLUR_ICONE_CORACAO +
        "</button>" +
        '<a href="../Página de Compra/compra.html?id=' + produto.id + '" aria-label="Ver ' + produto.nome + '">' +
        '<img src="' + produto.imagens[0] + '" alt="' + produto.nome + '" loading="lazy">' +
        "</a>" +
        "</div>" +
        '<div class="produto-corpo">' +
        '<span class="produto-categoria">' + SOLUR_CATEGORIAS[produto.categoria] + "</span>" +
        '<h3 class="produto-nome"><a href="../Página de Compra/compra.html?id=' + produto.id + '">' + produto.nome + "</a></h3>" +
        '<div class="produto-precos">' +
        '<span class="produto-preco">' + solurFormatarPreco(produto.preco) + "</span>" +
        (produto.precoAntigo ? '<span class="produto-preco-antigo">' + solurFormatarPreco(produto.precoAntigo) + "</span>" : "") +
        "</div>" +
        '<div class="produto-acoes">' +
        '<button class="botao" data-adicionar="' + produto.id + '">Adicionar</button>' +
        '<a class="botao-fantasma botao-ver" href="../Página de Compra/compra.html?id=' + produto.id + '" aria-label="Ver produto">Ver</a>' +
        "</div>" +
        "</div>" +
        "</article>"
    );
}

function solurRenderizarGrade(container, produtos) {
    if (!container) return;

    if (produtos.length === 0) {
        container.innerHTML = '<p class="mensagem-vazia">Nenhum produto encontrado nas trevas.</p>';
        return;
    }

    container.innerHTML = produtos.map(solurCardProduto).join("");
    solurSincronizarCoracoes();
}

/* ---------- adição rápida ao carrinho ---------- */

function solurAdicaoRapida(id) {
    const produto = solurBuscarProduto(id);
    if (!produto) return;

    if (produto.tamanhos && produto.tamanhos.length > 0) {
        solurToast("Escolha o tamanho na página do produto.");
        window.location.href = "../Página de Compra/compra.html?id=" + produto.id;
        return;
    }

    carrinhoAdicionar(produto.id, null, 1);
    solurToast(produto.nome + " adicionado à sacola.");
    abrirDrawer();
}

/* ---------- conta do cliente ---------- */

function solurHashSenha(senha) {
    /* hash didático (djb2 com sal) — não substitui criptografia de produção */
    var texto = "solur::" + senha;
    var hash = 5381;
    for (var i = 0; i < texto.length; i++) {
        hash = ((hash << 5) + hash + texto.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
}

function solurUsuariosObter() {
    try {
        var lista = JSON.parse(localStorage.getItem("solur_usuarios"));
        return Array.isArray(lista) ? lista : [];
    } catch (erro) {
        return [];
    }
}

function solurContaAtual() {
    try {
        var sessao = JSON.parse(localStorage.getItem("solur_sessao"));
        return sessao && sessao.email ? sessao : null;
    } catch (erro) {
        return null;
    }
}

function solurIniciais(nome) {
    var partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function solurContaAtualizarCabecalho() {
    var botao = document.getElementById("botaoConta");
    var sessao = solurContaAtual();

    document.querySelectorAll("[data-nome-usuario]").forEach(function (el) {
        el.textContent = sessao ? sessao.nome.split(" ")[0] : "";
    });

    if (!botao) return;

    var iniciais = botao.querySelector(".iniciais-conta");
    botao.dataset.logado = sessao ? "true" : "false";
    botao.setAttribute("aria-label", sessao ? "Minha conta de " + sessao.nome : "Entrar na sua conta");

    if (iniciais) {
        iniciais.textContent = sessao ? solurIniciais(sessao.nome) : "";
        iniciais.hidden = !sessao;
    }
}

function solurContaCriarModal() {
    if (document.getElementById("contaOverlay")) return;

    var overlay = document.createElement("div");
    overlay.className = "conta-overlay";
    overlay.id = "contaOverlay";
    overlay.hidden = true;
    overlay.innerHTML =
        '<div class="conta-modal" role="dialog" aria-modal="true" aria-labelledby="tituloConta">' +
        '<button type="button" class="fechar-conta" id="fecharConta" aria-label="Fechar">&times;</button>' +
        '<span class="conta-simbolo" aria-hidden="true">&#10022;</span>' +
        '<h2 id="tituloConta">ENTRE NO CLÃ</h2>' +
        '<p class="conta-sub" id="subtituloConta">Acompanhe pedidos, favoritos e finalize suas compras mais rápido.</p>' +
        '<div class="conta-abas" id="abasConta" role="tablist">' +
        '<button type="button" class="conta-aba ativa" role="tab" aria-selected="true" data-aba="entrar">Entrar</button>' +
        '<button type="button" class="conta-aba" role="tab" aria-selected="false" data-aba="criar">Criar conta</button>' +
        '</div>' +
        '<form class="form-conta" id="formLogin" novalidate>' +
        '<label for="loginEmail">E-mail</label>' +
        '<input type="email" id="loginEmail" placeholder="voce@email.com" autocomplete="email">' +
        '<label for="loginSenha">Senha</label>' +
        '<input type="password" id="loginSenha" placeholder="Sua senha" autocomplete="current-password">' +
        '<p class="conta-erro" id="erroLogin" role="alert"></p>' +
        '<button type="submit" class="botao">ENTRAR</button>' +
        '</form>' +
        '<form class="form-conta" id="formCadastro" novalidate hidden>' +
        '<label for="cadastroNome">Nome completo</label>' +
        '<input type="text" id="cadastroNome" placeholder="Como devemos te chamar" autocomplete="name">' +
        '<label for="cadastroEmail">E-mail</label>' +
        '<input type="email" id="cadastroEmail" placeholder="voce@email.com" autocomplete="email">' +
        '<label for="cadastroSenha">Senha</label>' +
        '<input type="password" id="cadastroSenha" placeholder="Mínimo de 6 caracteres" autocomplete="new-password">' +
        '<label for="cadastroConfirma">Confirmar senha</label>' +
        '<input type="password" id="cadastroConfirma" placeholder="Repita a senha" autocomplete="new-password">' +
        '<p class="conta-erro" id="erroCadastro" role="alert"></p>' +
        '<button type="submit" class="botao">CRIAR CONTA</button>' +
        '</form>' +
        '<div class="painel-conta" id="painelConta" hidden>' +
        '<p class="conta-ola">Olá, <strong id="nomePainelConta"></strong></p>' +
        '<p class="conta-email" id="emailPainelConta"></p>' +
        '<p class="conta-pedidos" id="pedidosPainelConta"></p>' +
        '<a class="botao" href="../Página de Carrinho/carrinho.html">VER MINHA SACOLA</a>' +
        '<button type="button" class="botao-fantasma" id="sairConta">SAIR DA CONTA</button>' +
        '</div>' +
        '<p class="conta-nota">Projeto escolar: a conta fica salva apenas neste navegador.</p>' +
        '</div>';

    document.body.appendChild(overlay);
}

function solurContaMostrarAba(aba) {
    var logado = !!solurContaAtual();
    var abas = document.getElementById("abasConta");
    var painel = document.getElementById("painelConta");
    var login = document.getElementById("formLogin");
    var cadastro = document.getElementById("formCadastro");
    var subtitulo = document.getElementById("subtituloConta");
    var titulo = document.getElementById("tituloConta");

    if (!abas || !login || !cadastro) return;

    abas.hidden = logado;
    painel.hidden = !logado;
    login.hidden = logado || aba !== "entrar";
    cadastro.hidden = logado || aba !== "criar";
    titulo.textContent = logado ? "MINHA CONTA" : "ENTRE NO CLÃ";
    subtitulo.textContent = logado
        ? "Seus dados ficam salvos neste navegador."
        : "Acompanhe pedidos, favoritos e finalize suas compras mais rápido.";

    document.querySelectorAll(".conta-aba").forEach(function (botao) {
        var ativa = botao.dataset.aba === aba;
        botao.classList.toggle("ativa", ativa);
        botao.setAttribute("aria-selected", ativa ? "true" : "false");
    });

    var erroLogin = document.getElementById("erroLogin");
    var erroCadastro = document.getElementById("erroCadastro");
    if (erroLogin) erroLogin.textContent = "";
    if (erroCadastro) erroCadastro.textContent = "";

    var campo = logado ? null : document.getElementById(aba === "criar" ? "cadastroNome" : "loginEmail");
    if (campo) setTimeout(function () { campo.focus(); }, 60);
}

function solurContaPainelAtualizar() {
    var sessao = solurContaAtual();
    if (!sessao) return;

    var nome = document.getElementById("nomePainelConta");
    var email = document.getElementById("emailPainelConta");
    var pedidos = document.getElementById("pedidosPainelConta");

    if (nome) nome.textContent = sessao.nome;
    if (email) email.textContent = sessao.email;

    if (pedidos) {
        var lista = [];
        try { lista = JSON.parse(localStorage.getItem("solur_pedidos") || "[]"); } catch (erro) { lista = []; }
        var meus = lista.filter(function (pedido) {
            return String(pedido.email || "").toLowerCase() === sessao.email.toLowerCase();
        });
        pedidos.textContent = meus.length === 0
            ? "Nenhum pedido registrado neste navegador ainda."
            : meus.length + (meus.length === 1 ? " pedido registrado neste navegador." : " pedidos registrados neste navegador.");
    }
}

function solurContaAbrir() {
    solurContaCriarModal();
    var overlay = document.getElementById("contaOverlay");
    overlay.hidden = false;
    document.body.classList.add("conta-aberta");
    solurContaMostrarAba("entrar");
    solurContaPainelAtualizar();
    document.getElementById("fecharConta").focus();
}

function solurContaFechar() {
    var overlay = document.getElementById("contaOverlay");
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("conta-aberta");
    var botao = document.getElementById("botaoConta");
    if (botao) botao.focus();
}

function solurContaIniciarSessao(usuario) {
    localStorage.setItem("solur_sessao", JSON.stringify({
        nome: usuario.nome,
        email: usuario.email,
        desde: new Date().toISOString()
    }));
    solurContaAtualizarCabecalho();
}

function solurEntrar(email, senha) {
    email = String(email || "").trim().toLowerCase();
    var usuario = solurUsuariosObter().find(function (item) {
        return item.email === email;
    });

    if (!usuario) return { ok: false, mensagem: "E-mail não cadastrado. Crie uma conta." };
    if (usuario.senha !== solurHashSenha(senha)) return { ok: false, mensagem: "Senha incorreta. Tente novamente." };

    solurContaIniciarSessao(usuario);
    return { ok: true, usuario: usuario };
}

function solurCriarConta(nome, email, senha, confirmacao) {
    nome = String(nome || "").trim();
    email = String(email || "").trim().toLowerCase();

    if (nome.length < 2) return { ok: false, mensagem: "Informe seu nome completo." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, mensagem: "E-mail inválido." };
    if (String(senha).length < 6) return { ok: false, mensagem: "A senha precisa ter pelo menos 6 caracteres." };
    if (senha !== confirmacao) return { ok: false, mensagem: "As senhas não conferem." };
    if (solurUsuariosObter().some(function (item) { return item.email === email; })) {
        return { ok: false, mensagem: "Já existe uma conta com este e-mail." };
    }

    var usuario = {
        nome: nome,
        email: email,
        senha: solurHashSenha(senha),
        criadoEm: new Date().toISOString()
    };

    var usuarios = solurUsuariosObter();
    usuarios.push(usuario);
    localStorage.setItem("solur_usuarios", JSON.stringify(usuarios));
    solurContaIniciarSessao(usuario);
    return { ok: true, usuario: usuario };
}

function solurSair() {
    localStorage.removeItem("solur_sessao");
    solurContaAtualizarCabecalho();
}

/* ---------- inicialização global ---------- */

document.addEventListener("DOMContentLoaded", function () {
    /* menu mobile */
    const botaoMenu = document.getElementById("botaoMenuMobile");
    const menu = document.querySelector(".menu");

    if (botaoMenu && menu) {
        botaoMenu.addEventListener("click", function () {
            menu.classList.toggle("aberto");
        });
    }

    /* conta do cliente */
    solurContaCriarModal();
    solurContaAtualizarCabecalho();

    const botaoConta = document.getElementById("botaoConta");
    if (botaoConta) {
        botaoConta.addEventListener("click", solurContaAbrir);
    }

    const overlayConta = document.getElementById("contaOverlay");

    if (overlayConta) {
        overlayConta.addEventListener("click", function (evento) {
            if (evento.target === overlayConta || evento.target.closest("#fecharConta")) {
                solurContaFechar();
            }
        });
    }

    document.querySelectorAll(".conta-aba").forEach(function (aba) {
        aba.addEventListener("click", function () {
            solurContaMostrarAba(aba.dataset.aba);
        });
    });

    const formLogin = document.getElementById("formLogin");
    if (formLogin) {
        formLogin.addEventListener("submit", function (evento) {
            evento.preventDefault();
            const resultado = solurEntrar(
                document.getElementById("loginEmail").value,
                document.getElementById("loginSenha").value
            );
            const erro = document.getElementById("erroLogin");

            if (!resultado.ok) {
                erro.textContent = resultado.mensagem;
                return;
            }

            erro.textContent = "";
            formLogin.reset();
            solurContaMostrarAba("entrar");
            solurContaPainelAtualizar();
            solurToast("Bem-vindo de volta, " + resultado.usuario.nome.split(" ")[0] + ".");
        });
    }

    const formCadastro = document.getElementById("formCadastro");
    if (formCadastro) {
        formCadastro.addEventListener("submit", function (evento) {
            evento.preventDefault();
            const resultado = solurCriarConta(
                document.getElementById("cadastroNome").value,
                document.getElementById("cadastroEmail").value,
                document.getElementById("cadastroSenha").value,
                document.getElementById("cadastroConfirma").value
            );
            const erro = document.getElementById("erroCadastro");

            if (!resultado.ok) {
                erro.textContent = resultado.mensagem;
                return;
            }

            erro.textContent = "";
            formCadastro.reset();
            solurContaFechar();
            solurToast("Conta criada. Bem-vindo ao clã, " + resultado.usuario.nome.split(" ")[0] + ".");
        });
    }

    const botaoSair = document.getElementById("sairConta");
    if (botaoSair) {
        botaoSair.addEventListener("click", function () {
            solurSair();
            solurContaFechar();
            solurToast("Você saiu da sua conta.");
        });
    }

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && overlayConta && !overlayConta.hidden) {
            solurContaFechar();
        }
    });

    /* pré-preenche o checkout com os dados da conta */
    const sessao = solurContaAtual();
    if (sessao) {
        const nomeCheckout = document.getElementById("nomeCompleto");
        const emailCheckout = document.getElementById("emailCheckout");

        if (nomeCheckout && !nomeCheckout.value) nomeCheckout.value = sessao.nome;
        if (emailCheckout && !emailCheckout.value) emailCheckout.value = sessao.email;
    }

    /* busca do header */
    document.querySelectorAll("form.campo-busca").forEach(function (formulario) {
        formulario.addEventListener("submit", function (evento) {
            if (window.SOLUR_BUSCA_LOCAL) return;

            evento.preventDefault();
            const termo = formulario.querySelector("input").value.trim();
            window.location.href =
                "../Página de Produtos/produtos.html" + (termo ? "?q=" + encodeURIComponent(termo) : "");
        });
    });

    /* delegação: favoritos e adição rápida */
    document.addEventListener("click", function (evento) {
        const coracao = evento.target.closest("[data-favorito]");
        if (coracao) {
            evento.preventDefault();
            solurFavoritoAlternar(coracao.dataset.favorito);
            return;
        }

        const adicionar = evento.target.closest("[data-adicionar]");
        if (adicionar) {
            evento.preventDefault();
            solurAdicaoRapida(adicionar.dataset.adicionar);
        }
    });

    /* ano automático no rodapé */
    document.querySelectorAll("[data-ano]").forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });

    solurAtualizarBadges();
    solurSincronizarCoracoes();
});
