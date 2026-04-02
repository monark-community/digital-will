# How to Use This Template

This template helps you quickly start a **Monark project** with the **standard monorepo structure**, pre-configured licenses, policies, and workflows. It includes:

- Standardized **monorepo structure** for Monark projects.
- Predefined **issue templates** and **labels** for consistent project management.
- Guidance to get started with **Monark workflows**.

> **Tip:** Once you’ve completed these setup steps, you can delete this section from your repository.

---

## Setup Steps

1. **Replace placeholders** in your project files:  
   - `{{PROJECT_NAME}}` → Your project name  
   - `{{PROJECT_DESCRIPTION}}` → Short description of the project  
   - `{{PROJECT_REPOSITORY_NAME}}` → GitHub repository name  
   - `{{START_YEAR}}` → Project start year  
   - `{{CURRENT_YEAR}}` → Current year  

2. **Sync repository labels with the template repository**  
   1. Make sure your **workflow permissions** are set to **Read & Write**:  
      [GitHub Actions workflow permissions](https://github.com/marketplace/actions/github-label-sync-action#403-resource-not-accessible-by-integration)  
   2. Go to the **Actions** tab in your repository and run the **`Apply Template Labels`** workflow.  
   3. Confirm that the repository now contains the **standard Monark labels** (for example, check that `P0 🟣` exists).


---

# {{PROJECT_NAME}}

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![GitHub Issues](https://img.shields.io/github/issues/monark-community/{{PROJECT_NAME}})
![GitHub Issues](https://img.shields.io/github/issues-pr/monark-community/{{PROJECT_NAME}})
![GitHub Stars](https://img.shields.io/github/stars/monark-community/{{PROJECT_NAME}})
![GitHub Forks](https://img.shields.io/github/forks/monark-community/{{PROJECT_NAME}})

{{PROJECT_NAME}} is {{PROJECT_DESCRIPTION}}...

## Overview

TODO

## Key Features

- 🚀 Feature 1
- ✅ Feature 2
- 📃 Feature 3

## Project Structure

```
{{PROJECT_REPOSITORY_NAME}}/
├── packages/
│   ├── shared/                   # Shared types and utilities
│   ├── smart-contracts/          # Solidity contracts + ZK circuits
│   │   ├── contracts/            # Smart contracts
│   │   ├── circuits/             # Circom ZK circuits
│   │   └── test/                 # Contract tests
│   └── subgraph/                 # The Graph indexing
├── services/
│   ├── api/                      # Backend API (Node.js + PostgreSQL)
│   │   ├── src/controllers/      # API endpoints
│   │   └── src/middlewares/      # Auth, validation
│   │   ├── src/models/           # Data Models
│   │   ├── src/routes/           # API Routes with OpenAPI documentation
│   │   ├── src/services/         # Business logic
│   └── web/                      # Frontend (Next.js + React)
│       ├── app/                  # App router pages
│       ├── components/           # UI components
│       └── services/             # API clients, blockchain
└── infra/
    └── docker-compose.yaml       # Optional global infrastructure
```

## Getting Started

TODO

## Available Scripts

TODO

## Deployment

TODO

## Documentation

If changes are done to the will.sol, then the will factory needs to be redeployed as well.
If the will factory is redeployed, its address needs to be updated in the following .env files: 
.env.local in services/web
.env in project root
.env in services/api/src/substreams

## Contribution

See [CONTRIBUTION.md](./CONTRIBUTION.md) to learn about contributions guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) to learn about the code of conduct.

## License

See the [LICENSE](./LICENSE) file to learn more about this project's licensing.