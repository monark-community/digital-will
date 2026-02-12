# Setup Instructions

## 1. Install Required Tools
- Install the **Juan Blanco Solidity** extension in your editor: [link](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)  
- Install **Foundry** on your system: [https://getfoundry.sh/](https://getfoundry.sh/)

## 2. Configure Solidity Compiler Version
- Open VSCode and press `Ctrl+Shift+P` to open the command palette  
- Add the following line to your settings (`settings.json`):
```json
"solidity.compileUsingRemoteVersion": "0.8.19"
```