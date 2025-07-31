# Usage Examples

This document shows how the SmartDirect Bot handles different languages, units, and currencies.

## English Examples

### Shipping Quote (Imperial Units)
**User:** "I need a quote for 5 lbs, 12x8x6 inches to 01310-100"

**Bot Response:**
```
📦 Shipping Quote:

💰 Total Cost: $45.60 USD / R$ 236.11 BRL
⏱️ Estimated Transit: 5-7 business days
📏 Weight: 5.0 lbs
📐 Dimensions: 12.0 x 8.0 x 6.0 inches
🚚 Service: UPS Standard to Brazil

20% service fee included
Exchange rate: US$ 1 = R$ 5.18
```

### Shipping Quote (Metric Units)
**User:** "How much to ship 2.5 kg, 30x20x15 cm to São Paulo 04038-001?"

**Bot Response:**
```
📦 Shipping Quote:

💰 Total Cost: $42.30 USD / R$ 219.11 BRL
⏱️ Estimated Transit: 5-7 business days
📏 Weight: 5.5 lbs (2.5 kg)
📐 Dimensions: 11.8 x 7.9 x 5.9 in (30 x 20 x 15 cm)
🚚 Service: UPS Standard to Brazil

20% service fee included
Exchange rate: US$ 1 = R$ 5.18
```

### Package Tracking
**User:** "Track 1Z999AA1234567890"

**Bot Response:**
```
📦 Tracking Update for 1Z999AA1234567890:

Status: In Transit
Location: Miami, FL
Last Update: 2025-07-30 14:30
Estimated Delivery: 2025-08-03
```

## Portuguese Examples

### Cotação de Frete (Unidades Métricas)
**Usuário:** "Preciso de uma cotação para 3 kg, 25x15x10 cm para o CEP 20040-020"

**Resposta do Bot:**
```
📦 Cotação de Frete:

💰 Valor Total: $38.40 USD / R$ 198.91 BRL
⏱️ Prazo de Entrega: 5-7 dias úteis
📏 Peso: 3 kg (6.6 lbs)
📐 Dimensões: 25 x 15 x 10 cm (9.8 x 5.9 x 3.9 pol)
🚚 Serviço: UPS Standard para Brasil

Taxa de serviço de 20% incluída
Câmbio: US$ 1 = R$ 5.18
```

### Cotação de Frete (Unidades Imperiais)
**Usuário:** "Quanto custa enviar 4 libras, 10x8x5 polegadas para Brasília?"

**Resposta do Bot:**
```
📦 Cotação de Frete:

💰 Valor Total: $41.20 USD / R$ 213.42 BRL
⏱️ Prazo de Entrega: 5-7 dias úteis
📏 Peso: 4.0 libras
📐 Dimensões: 10.0 x 8.0 x 5.0 polegadas
🚚 Serviço: UPS Standard para Brasil

Taxa de serviço de 20% incluída
Câmbio: US$ 1 = R$ 5.18
```

### Rastreamento de Pacote
**Usuário:** "Rastreio 1Z999AA1234567890"

**Resposta do Bot:**
```
📦 Atualização de Rastreamento para 1Z999AA1234567890:

Status: Em Trânsito
Localização: Miami, FL
Última Atualização: 2025-07-30 14:30
Entrega Prevista: 2025-08-03
```

### Informações sobre Alfândega
**Usuário:** "Que documentos preciso para alfândega?"

**Resposta do Bot:**
```
Para envios do EUA para o Brasil, você precisará:

📋 Documentos Obrigatórios:
• CPF do destinatário
• Declaração de conteúdo detalhada
• Nota fiscal (para produtos comerciais)

💰 Impostos:
• Compras até US$ 50: isenção de impostos
• Acima de US$ 50: 60% de imposto de importação + ICMS

🚫 Itens Proibidos:
• Alimentos perecíveis
• Medicamentos sem receita
• Produtos de origem animal

Nós cuidamos de toda a documentação alfandegária para você!
```

## Mixed Language Detection

### English User with Portuguese Location
**User:** "I need shipping to Rio de Janeiro, CEP 22071-900"

**Bot Response:** (Responds in English but recognizes Brazilian context)
```
I can help you ship to Rio de Janeiro! To provide an accurate quote, I'll need:

📏 Package weight (lbs or kg)
📐 Dimensions (inches or cm)
🇧🇷 Your package will be delivered to CEP 22071-900

Please note: You'll need a CPF for Brazilian customs clearance.
```

### Portuguese User with Imperial Units
**Usuário:** "Frete para 3 pounds, 12 inches comprimento"

**Resposta do Bot:** (Responds in Portuguese, handles mixed units)
```
Posso ajudar com o frete! Recebi o peso (3 libras), mas preciso das dimensões completas:

📐 Largura e altura (em polegadas ou cm)
📍 CEP de destino no Brasil

Com essas informações, posso calcular o frete exato para você.
```

## Advanced Unit Conversion Examples

### Complex Metric Input
**User:** "30 centímetros x 25 cm x 15 centímetros, 2.8 quilos para 01310-100"

**Bot Response:**
```
📦 Cotação de Frete:

💰 Valor Total: $39.80 USD / R$ 206.16 BRL
⏱️ Prazo de Entrega: 5-7 dias úteis
📏 Peso: 2.8 kg (6.2 lbs)
📐 Dimensões: 30 x 25 x 15 cm (11.8 x 9.8 x 5.9 pol)
🚚 Serviço: UPS Standard para Brasil

Taxa de serviço de 20% incluída
Câmbio: US$ 1 = R$ 5.18
```

### Mixed Units Input
**User:** "5 lbs package, dimensions 25cm x 20cm x 30cm to São Paulo"

**Bot Response:**
```
📦 Shipping Quote:

💰 Total Cost: $44.60 USD / R$ 231.08 BRL
⏱️ Estimated Transit: 5-7 business days
📏 Weight: 5.0 lbs
📐 Dimensions: 9.8 x 7.9 x 11.8 in (25 x 20 x 30 cm)
🚚 Service: UPS Standard to Brazil

20% service fee included
Exchange rate: US$ 1 = R$ 5.18
```

## Error Handling Examples

### Invalid Weight
**User:** "Quote for 200 lbs package to Brazil"

**Bot Response:**
```
❌ Invalid package data

• Weight cannot exceed 150 lbs for international shipping

Maximum limits for Brazil:
📏 Weight: 150 lbs (68 kg)
📐 Dimensions: 108 inches (274 cm) on any side
```

### Missing Information
**User:** "How much to ship to Brazil?"

**Bot Response:**
```
I'd be happy to help with a shipping quote! I need a few details:

📏 Package weight (lbs or kg)
📐 Dimensions - length x width x height (inches or cm)
📍 Destination CEP (Brazilian postal code)

Example: "5 lbs, 12x8x6 inches to 01310-100"
```

### Invalid CEP
**User:** "5 lbs, 12x8x6 to 12345"

**Bot Response:**
```
❌ Invalid package data

• Valid Brazilian CEP (postal code) is required

Brazilian CEP format: 12345-678 or 12345678
Please provide a valid 8-digit CEP for accurate shipping calculation.
```

## API Request Examples

### Curl Request (English)
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quote for 5 lbs, 12x8x6 inches to 01310-100",
    "userId": "user123"
  }'
```

### Curl Request (Portuguese)
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cotação para 3 kg, 25x15x10 cm para CEP 20040-020",
    "userId": "usuario456"
  }'
```

### Response Format
```json
{
  "reply": "📦 Shipping Quote:\n\n💰 Total Cost: $45.60 USD / R$ 236.11 BRL...",
  "requestId": "req-1722361234567-abc123",
  "processingTime": 1250,
  "language": "en"
}
```

## Special Features

### Customs Information Request
**User:** "Do I need to pay taxes on a $30 item?"

**Bot Response:**
```
🇧🇷 Brazilian Customs Information:

For a $30 USD item:
✅ Tax-free! Items up to $50 USD are exempt from import duties.

📋 Required Documentation:
• Recipient's CPF
• Detailed content declaration
• Proof of purchase value

⚡ We handle all customs paperwork for you!

Need a shipping quote? Just send me the package details.
```

### Business Hours (Portuguese)
**Usuário:** "Vocês funcionam aos sábados?"

**Resposta do Bot:**
```
📞 Horário de Atendimento:

🇺🇸 Estados Unidos:
Segunda a Sexta: 9h às 18h (EST)

🇧🇷 Brasil:
Segunda a Sexta: 11h às 20h (horário de Brasília)

📧 Para suporte 24/7, envie um email para support@smartdirect.com

Posso ajudar com cotações e rastreamento a qualquer hora!
```