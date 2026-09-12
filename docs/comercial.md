# Venda para outras escolinhas — posicionamento e preço

Decidido em 12/09/2026, depois de análise de mercado e de custo. Este
documento guarda a decisão e o raciocínio para não reabrir sem motivo.

## Decisão: low cost

O custo operacional por escolinha é praticamente zero (ver "Custo" abaixo),
então o preço não precisa cobrir infra — precisa cobrir o tempo de suporte
e deixar margem. O produto se posiciona como **"simples, sem taxa por
transação, funciona no celular"**, para escolinha de interior com 1 gestor e
1–3 professores. Quem precisa de cobrança automática, boleto ou WhatsApp por
API não é o cliente: vai para Gestão Fut/Fensor a R$ 150–280.

| Oferta | Preço |
|---|---|
| Gestão (até ~250 alunos) | **R$ 39/mês** |
| Site + Gestão | **R$ 59/mês** |
| Implantação | R$ 0 se a escolinha importa o CSV; R$ 150 se a gente faz |
| Anual | 10 × mensal (2 meses grátis) |

Regras que sustentam o preço:

1. **Suporte só por WhatsApp, em horário definido**, com `GESTAO.md` como
   primeira resposta. A R$ 39, uma hora de suporte come o mês.
2. **Não prometer o que não existe**: sem cobrança automática, boleto, NF,
   WhatsApp automático. O que tem: Pix copia-e-cola, WhatsApp por link,
   chamada offline, área da família em PWA, site com pré-matrícula.
3. **Reajuste anual previsto no contrato** desde o primeiro cliente.

O diferencial de venda é o **site institucional com pré-matrícula
integrada** — nenhum concorrente pesquisado entrega isso.

## Como publicar para outra escolinha

**Um projeto Firebase por escolinha**, sem mexer no código: o app já assume
uma escolinha por projeto (`configuracoes/escolinha`), cada projeto tem a
própria cota gratuita, os dados ficam isolados e os scripts `seed-site` e
`criar-acesso` fazem o trabalho. Aguenta os primeiros 10–15 clientes (a
conta Google limita a ~12–25 projetos sem pedir aumento). Multi-tenant
(`escolinhaId` em todo documento + regras) só se passar disso.

## Custo por escolinha (estimado em 12/09/2026)

Sem Cloud Functions, gateway, SMS ou busca externa. Uso mensal estimado com
1 gestor (2 acessos/dia), 3 professores (chamada 3×/semana), famílias
entrando 4×/mês:

| Item | 50 alunos | 100 alunos | Cota grátis/mês |
|---|---|---|---|
| Leituras Firestore | ~18 mil | ~35 mil | 1,5 milhão |
| Gravações | ~1,2 mil | ~2,5 mil | 600 mil |
| Firestore armazenado | < 5 MB | < 10 MB | 1 GiB |
| Storage (fotos) | ~10 MB | ~20 MB | 5 GB |
| Hosting | ~300 MB | ~600 MB | 10 GB |
| **Firebase** | **R$ 0** | **R$ 0** | |

Errando por 10×, ainda fica em R$ 1–2/mês. A conta só aparece perto de
2–3 mil alunos no mesmo projeto, ou se entrar WhatsApp por API (custo do
provedor, ~R$ 0,05–0,10/mensagem).

Custos reais: implantação (3–6 h por escolinha), suporte (1–2 h/mês no
início), imposto (MEI provavelmente não cobre licenciamento de software —
confirmar com contador; ME no Simples, 6% a 15,5%).

## Mercado pesquisado (setembro/2026)

| Concorrente | Preço | Limite | Tem a mais |
|---|---|---|---|
| Canchero | R$ 59,90 / 79,90 / 99,90 | 100 / 250 / 600 | Pix, WhatsApp automático, portal dos pais, CRM |
| Escolita | R$ 127 / 247 / 497 | 75 / 200 / 500 | Cobrança automatizada |
| Fensor | R$ 149,90–249 | ilimitado | Pix/boleto/cartão, loja |
| Gestão Fut | R$ 230 / 280 | — | API WhatsApp, boleto, NF, contratos, Asaas/Inter/Cora |
| SporTI | R$ 279–349 | ilimitado | App nas lojas, cartão parcelado |
| AppFUT | sem mensalidade | — | Cobra por transação Pix |
| EsportivaHub | personalizado | ilimitado | R$ 1,29/Pix, 3,69% cartão |

O preço de mercado é puxado por cobrança automática e WhatsApp por API.
Mensalidade média de escolinha independente é R$ 60–90; uma escolinha de 50
alunos fatura R$ 3–4,5 mil/mês e aceita gastar até uma mensalidade de aluno
com sistema.
