##  Quick 45s Demo Video:

https://drive.google.com/file/d/1OrhHWb6zOEmiFWT9FmUCtzHlI9kvprOa/view?usp=

# Natural Language to structured query:

A schema-aware system that converts natural language into validated structured queries and executes them deterministically over data.
> [!Note]
> The query execution and validation are deterministic and controlled by the system, not the LLM.
> The Hugging Face LLM can be replaced with superior models like OpenAI or Anthropic models.
> This is a demo project.



## Overview

- User sends a natural language query  
- LLM translates → structured query (JSON)  
- Query is validated (Zod)  
- Executor runs it on dataset  
- Results returned via API  

LLM is used only for translation — execution is fully deterministic.

## Stack

Node.js, TypeScript, Express, Zod, Pino, Hugging Face

## Run

```bash
npm install
npm run dev
````

`.env`:

```env
HF_TOKEN=your_hugging_face_token
PORT=8000
```

## API

POST `/api/v1/query`

```json
{
  "query": "Show unpaid invoices above 50000"
}
```
POST `/api/v1/query`

```json
{
  "query": "Show unpaid invoices above 50000"
}
```
query created for this req: 
```json
{
  "structuredQuery": {
        "dataset": "invoices",
        "select": [
            "invoice_id",
            "customer",
            "amount",
            "status"
        ],
        "filters": [
            {
                "field": "status",
                "operator": "eq",
                "value": "unpaid"
            },
            {
                "field": "amount",
                "operator": "gt",
                "value": 50000
            }
        ],
        "limit": 100
    },
}
```
query Response: 

```json
[
  {
      "invoice_id": "INV-1002",
      "customer": "Globex Ltd",
      "amount": 72000,
      "status": "unpaid"
  },
  {
      "invoice_id": "INV-1005",
      "customer": "Soylent Systems",
      "amount": 91000,
      "status": "unpaid"
  },
  {
      "invoice_id": "INV-1009",
      "customer": "Wonka Labs",
      "amount": 61000,
      "status": "unpaid"
  },
  {
      "invoice_id": "INV-1017",
      "customer": "Stark Industries",
      "amount": 110000,
      "status": "unpaid"
  },
  {
      "invoice_id": "INV-1024",
      "customer": "Umbrella Corp",
      "amount": 76000,
      "status": "unpaid"
  }
]
```

Example Queries (easy → complex):
```
Show all unpaid invoices
Show invoices above 80000
Show invoices from North
Show invoices for Acme Corp
Show unpaid invoices above 50000
Show overdue invoices from South sorted by amount
Show top 5 highest invoices
Show unpaid invoices from North above 30000 sorted by amount descending
```



## Key Idea

Unstructured intent → validated query → controlled execution.
