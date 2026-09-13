// Os dois apps são sites separados do Hosting (DEPLOY.md), mas a conta é a
// mesma — um precisa saber o endereço do outro para mandar quem entrou pela
// porta errada. Em desenvolvimento cada um roda na sua porta do Vite.
export const URL_SITE = import.meta.env.DEV ? 'http://localhost:5173' : 'https://www.patotina.com.br'
export const URL_PAINEL = `${URL_SITE}/app/`
export const URL_GESTAO = import.meta.env.DEV ? 'http://localhost:5174' : 'https://app.patotina.com.br'
