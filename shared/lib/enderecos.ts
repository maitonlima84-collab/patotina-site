// O painel mora dentro do endereço da gestão (/painel/) e não no do site: o
// navegador guarda a sessão do Firebase por endereço, e só assim quem entra
// num já está logado no outro. Em produção os caminhos são relativos — valem
// em app.patotina.com.br, em patotina-gestao.web.app e nos canais de teste.
// Em desenvolvimento a porta 5174 (gestão) repassa /painel/ ao Vite do painel.
export const URL_SITE = import.meta.env.DEV ? 'http://localhost:5173' : 'https://www.patotina.com.br'
export const URL_GESTAO = import.meta.env.DEV ? 'http://localhost:5174/' : '/'
export const URL_PAINEL = `${URL_GESTAO}painel/`
