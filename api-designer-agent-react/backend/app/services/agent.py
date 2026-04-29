from __future__ import annotations

import json
import os
import re
from typing import Any

try:
    from agents import Agent, Runner
except Exception:  # pragma: no cover - optional runtime dependency
    Agent = None
    Runner = None


DESIGN_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "openapi_yaml",
        "endpoint_summary_markdown",
        "schemas_json",
        "postman_collection",
        "sequence_diagram_mermaid",
        "design_review_markdown",
        "swagger_documentation_markdown",
        "development_kit",
        "testing_package",
        "deployment_package",
        "gateway_setup",
        "monitoring_readiness",
    ],
    "properties": {
        "openapi_yaml": {"type": "string"},
        "endpoint_summary_markdown": {"type": "string"},
        "schemas_json": {"type": "object"},
        "postman_collection": {"type": "object"},
        "sequence_diagram_mermaid": {"type": "string"},
        "design_review_markdown": {"type": "string"},
        "swagger_documentation_markdown": {"type": "string"},
        "development_kit": {"type": "object"},
        "testing_package": {"type": "object"},
        "deployment_package": {"type": "object"},
        "gateway_setup": {"type": "object"},
        "monitoring_readiness": {"type": "object"},
    },
    "additionalProperties": False,
}


class ApiDesignerAgent:
    def __init__(self) -> None:
        self.model = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
        self.mock_mode = os.getenv("MOCK_AGENT", "false").lower() == "true" or not os.getenv("OPENAI_API_KEY")
        self.agent = None

        if not self.mock_mode and Agent is not None:
            self.agent = Agent(
                name="API Designer Agent",
                model=self.model,
                instructions=(
                    "You are an autonomous API designer agent. Convert functional requirements into production-ready "
                    "REST API design artifacts. Generate standards-compliant OpenAPI 3.0.3 YAML, endpoint summaries, "
                    "JSON schemas, a Postman collection, a Mermaid sequence diagram, and a design review checklist. "
                    "Also produce Swagger/API documentation notes, a development kit, testing package, deployment package, "
                    "API gateway setup, and monitoring readiness checklist. "
                    "Prefer resource-oriented REST paths, explicit response codes, reusable schemas, pagination/error "
                    "patterns where useful, and clear security placeholders. Return only JSON matching the requested schema."
                ),
            )

    async def generate_design(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.mock_mode or self.agent is None or Runner is None:
            return self._mock_design(payload, mocked=True)

        prompt = (
            "Generate API design artifacts for this input. Return a single JSON object with these keys: "
            "openapi_yaml, endpoint_summary_markdown, schemas_json, postman_collection, "
            "sequence_diagram_mermaid, design_review_markdown, swagger_documentation_markdown, "
            "development_kit, testing_package, deployment_package, gateway_setup, monitoring_readiness.\n\n"
            f"Input:\n{json.dumps(payload, indent=2)}"
        )

        try:
            result = await Runner.run(self.agent, prompt)
            data = self._parse_json(result.final_output)
            return self._normalize_design(data, mocked=False)
        except Exception as exc:
            fallback = self._mock_design(payload, mocked=True)
            fallback["agent_status"] = f"Model call failed, served deterministic fallback: {exc}"
            return fallback

    def _parse_json(self, text: str) -> dict[str, Any]:
        cleaned = text.strip()
        fenced = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL)
        if fenced:
            cleaned = fenced.group(1).strip()
        return json.loads(cleaned)

    def _normalize_design(self, data: dict[str, Any], mocked: bool) -> dict[str, Any]:
        normalized = {
            "openapi_yaml": data.get("openapi_yaml", ""),
            "endpoint_summary_markdown": data.get("endpoint_summary_markdown", ""),
            "schemas_json": data.get("schemas_json", {}),
            "postman_collection": data.get("postman_collection", {}),
            "sequence_diagram_mermaid": data.get("sequence_diagram_mermaid", ""),
            "design_review_markdown": data.get("design_review_markdown", ""),
            "swagger_documentation_markdown": data.get("swagger_documentation_markdown", ""),
            "development_kit": data.get("development_kit", {}),
            "testing_package": data.get("testing_package", {}),
            "deployment_package": data.get("deployment_package", {}),
            "gateway_setup": data.get("gateway_setup", {}),
            "monitoring_readiness": data.get("monitoring_readiness", {}),
            "model": self.model,
            "mocked": mocked,
            "agent_status": "Generated by API Designer Agent",
        }
        return normalized

    def _mock_design(self, payload: dict[str, Any], mocked: bool) -> dict[str, Any]:
        req = payload["requirement"]
        title = req["title"]
        method = (req.get("method") or "post").lower()
        path = req.get("path") or self._path_from_title(title)
        operation = self._operation_id(method, path)
        schema_name = "".join(part.capitalize() for part in re.findall(r"[A-Za-z0-9]+", title)) or "Requirement"
        request_schema = f"{schema_name}Request"
        response_schema = f"{schema_name}Response"
        status_code = "201" if method == "post" else "200"

        openapi_yaml = self._mock_openapi(req, method, path, operation, request_schema, response_schema, status_code)
        schemas_json = {
            request_schema: {
                "type": "object",
                "required": ["policyNumber"],
                "properties": {
                    "policyNumber": {"type": "string", "example": "POL-100245"},
                    "customerId": {"type": "string", "example": "CUS-7732"},
                    "effectiveDate": {"type": "string", "format": "date"},
                },
            },
            response_schema: {
                "type": "object",
                "properties": {
                    "requestId": {"type": "string"},
                    "status": {"type": "string", "example": "SUCCESS"},
                    "message": {"type": "string"},
                },
            },
            "ErrorResponse": {
                "type": "object",
                "properties": {
                    "code": {"type": "string"},
                    "message": {"type": "string"},
                    "traceId": {"type": "string"},
                },
            },
        }

        endpoint_summary = (
            f"# {payload.get('domain', 'API')} API Design\n\n"
            f"| Method | Path | Operation | Source |\n"
            f"| --- | --- | --- | --- |\n"
            f"| `{method.upper()}` | `{path}` | {req.get('summary') or title} | {req.get('source') or 'Manual'} |\n\n"
            "## Design Notes\n"
            "- Uses OpenAPI 3.0.3.\n"
            "- Separates request, response, and error schemas.\n"
            "- Includes bearer authentication placeholder for gateway integration.\n"
        )

        postman_collection = {
            "info": {
                "name": f"{payload.get('domain', 'Generated')} API",
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            },
            "item": [
                {
                    "name": title,
                    "request": {
                        "method": method.upper(),
                        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
                        "url": {"raw": "{{baseUrl}}" + path, "host": ["{{baseUrl}}"], "path": [p for p in path.split("/") if p]},
                        "body": {"mode": "raw", "raw": json.dumps({"policyNumber": "POL-100245"}, indent=2)},
                    },
                }
            ],
        }

        sequence = (
            "sequenceDiagram\n"
            "  participant User\n"
            "  participant Client\n"
            "  participant API as Policy API\n"
            "  participant Store as Policy Store\n"
            f"  User->>Client: {title}\n"
            f"  Client->>API: {method.upper()} {path}\n"
            "  API->>API: Validate request and auth\n"
            "  API->>Store: Persist or retrieve policy data\n"
            "  Store-->>API: Result\n"
            f"  API-->>Client: {status_code} response\n"
        )

        review = (
            "# API Design Review\n\n"
            "- [x] Resource path is noun-oriented.\n"
            "- [x] Request and response schemas are reusable.\n"
            "- [x] Error response pattern is defined.\n"
            "- [x] Authentication placeholder is included.\n"
            "- [ ] Confirm enterprise naming and gateway policies.\n"
        )

        swagger_docs = (
            "# Swagger / API Documentation\n\n"
            f"- Load `openapi.yaml` in Swagger UI.\n"
            f"- Review `{method.upper()} {path}` for request body, response body, and error handling.\n"
            "- Use bearer token auth in the Authorize modal.\n"
            "- Execute test calls against a mock or sandbox base URL.\n"
        )

        dev_kit = {
            "readme.md": f"# {schema_name} API Development Kit\n\nGenerated server assets for `{method.upper()} {path}`.",
            "server_stub.py": self._server_stub(method, path, operation, request_schema),
            "models.py": self._models_stub(request_schema, response_schema),
            "validators.py": "def validate_payload(payload):\n    assert payload.get('policyNumber'), 'policyNumber is required'\n    return True\n",
            ".env.example": "PORT=8000\nLOG_LEVEL=INFO\nAPI_AUTH_ENABLED=true\n",
        }

        testing_package = {
            "unit_tests.py": f"def test_{operation}_happy_path():\n    assert True\n",
            "api_test_cases.md": f"# API Test Cases\n\n- 201/200 success for `{method.upper()} {path}`\n- 400 when required fields are missing\n- 401 when token is absent\n",
            "postman_tests.js": "pm.test('response is successful', () => pm.response.code < 300);\npm.test('has status', () => pm.expect(pm.response.json()).to.have.property('status'));\n",
            "schema_validation.py": "import jsonschema\n\ndef validate_response(schema, response):\n    jsonschema.validate(response, schema)\n",
            "performance_k6.js": "import http from 'k6/http';\nexport default function () { http.get(`${__ENV.BASE_URL}/health`); }\n",
        }

        deployment_package = {
            "Dockerfile": "FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nCMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n",
            "render.yaml": "services:\n  - type: web\n    runtime: python\n    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT\n",
            "github-actions.yml": "name: api-ci\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: pytest\n",
            "secrets.template": "API_TOKEN=\nDATABASE_URL=\nLOG_LEVEL=INFO\n",
        }

        gateway_setup = {
            "azure_apim_policy.xml": "<policies><inbound><base /><rate-limit calls=\"100\" renewal-period=\"60\" /></inbound></policies>",
            "kong_route.yaml": f"routes:\n  - name: {operation}\n    paths:\n      - {path}\n    methods:\n      - {method.upper()}\n",
            "nginx_location.conf": f"location {path} {{ proxy_pass http://api_backend; }}\n",
            "versioning": "Use /v1 prefix and semantic OpenAPI versioning.",
            "auth": "Attach OAuth2/JWT validation at gateway edge.",
        }

        monitoring = {
            "health_check": "/health",
            "logs": ["request_id", "operation_id", "status_code", "latency_ms"],
            "metrics": ["request_count", "error_rate", "p95_latency", "gateway_throttles"],
            "alerts": ["5xx error rate > 2%", "p95 latency > 1000ms", "health check failing"],
            "readiness_checklist": [
                "Health endpoint exposed",
                "Structured logging enabled",
                "Metrics dashboard prepared",
                "Error alerts configured",
                "Deployment rollback path documented",
            ],
        }

        return {
            "openapi_yaml": openapi_yaml,
            "endpoint_summary_markdown": endpoint_summary,
            "schemas_json": schemas_json,
            "postman_collection": postman_collection,
            "sequence_diagram_mermaid": sequence,
            "design_review_markdown": review,
            "swagger_documentation_markdown": swagger_docs,
            "development_kit": dev_kit,
            "testing_package": testing_package,
            "deployment_package": deployment_package,
            "gateway_setup": gateway_setup,
            "monitoring_readiness": monitoring,
            "model": self.model,
            "mocked": mocked,
            "agent_status": "Generated by deterministic local fallback" if mocked else "Generated by API Designer Agent",
        }

    def _mock_openapi(
        self,
        req: dict[str, Any],
        method: str,
        path: str,
        operation: str,
        request_schema: str,
        response_schema: str,
        status_code: str,
    ) -> str:
        request_body = ""
        if method != "get":
            request_body = f"""
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/{request_schema}'"""

        return f"""openapi: 3.0.3
info:
  title: Policy Management API
  version: 1.0.0
  description: Generated from {req.get('id', 'requirement')} - {req.get('desc', req.get('title', ''))}
servers:
  - url: https://api.company.com/v1
security:
  - bearerAuth: []
paths:
  {path}:
    {method}:
      operationId: {operation}
      summary: {req.get('summary') or req.get('title')}
      tags:
        - Policies{request_body}
      responses:
        '{status_code}':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{response_schema}'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    {request_schema}:
      type: object
      required:
        - policyNumber
      properties:
        policyNumber:
          type: string
          example: POL-100245
        customerId:
          type: string
          example: CUS-7732
        effectiveDate:
          type: string
          format: date
    {response_schema}:
      type: object
      properties:
        requestId:
          type: string
        status:
          type: string
          example: SUCCESS
        message:
          type: string
    ErrorResponse:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        traceId:
          type: string
"""

    def _path_from_title(self, title: str) -> str:
        slug = "-".join(re.findall(r"[a-z0-9]+", title.lower()))
        return f"/{slug or 'generated-resource'}"

    def _operation_id(self, method: str, path: str) -> str:
        parts = re.findall(r"[A-Za-z0-9]+", path)
        suffix = "".join(part.capitalize() for part in parts) or "GeneratedResource"
        return f"{method}{suffix}"

    def _server_stub(self, method: str, path: str, operation: str, request_schema: str) -> str:
        return (
            "from fastapi import APIRouter\n\n"
            "router = APIRouter()\n\n"
            f"@router.{method}(\"{path}\")\n"
            f"def {operation}(payload: dict | None = None):\n"
            f"    # TODO: map payload to {request_schema}, call service, return response DTO\n"
            "    return {\"status\": \"SUCCESS\"}\n"
        )

    def _models_stub(self, request_schema: str, response_schema: str) -> str:
        return (
            "from pydantic import BaseModel\n\n"
            f"class {request_schema}(BaseModel):\n"
            "    policyNumber: str\n"
            "    customerId: str | None = None\n\n"
            f"class {response_schema}(BaseModel):\n"
            "    requestId: str\n"
            "    status: str\n"
            "    message: str | None = None\n"
        )
