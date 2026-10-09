# Segurança

O preview executa o HTML do usuário em um `iframe` com `sandbox` e sem `allow-same-origin`.

Ainda assim, código inserido no editor deve ser tratado como não confiável. Ele pode fazer requisições de rede, abrir popups permitidos pelo sandbox e executar JavaScript dentro do próprio iframe.

Não adicione `allow-same-origin` ao preview sem revisar cuidadosamente o modelo de segurança.
