# Setup Instructions

## 1. Install Required Tools
- Install the **Juan Blanco Solidity** extension in your editor: [link](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)  
- Install **Foundry** on your system: [https://getfoundry.sh/](https://getfoundry.sh/)
- Install **make**

## 2. Configure Solidity Compiler Version
- Open VSCode and press `Ctrl+Shift+P` to open the command palette  
- Add the following line to your settings (`settings.json`):
```json
"solidity.compileUsingRemoteVersion": "0.8.19"
```

## 3. Using the Makefile
The Makefile.example provided is to be put into a new file called ```Makefile```.
It's purpose is to simplify the build, deployment and testing of the different smart contracts involved in the project.
<br>
<br>
Whenever we refer to ```ID```, we mean the ```ID```'th wallet among the 10 given by default when running anvil. You can specify who calls the function sometimes by assigning values to ```USER_ID``` and ```SM_ID```. 
<br>
<br>
By default, ```USER_ID = 0``` and ```SM_ID = 0```.
<br>
<br>
By default, ```wallet 0``` is the PM, and ```wallets 1``` and ```2``` are SM in the will deployed by default. See code in ```WillDeploy.s.sol```.

The following is for building and deploying:
```make
make build && make deploy-factory && make deploy-will
```

The following are getters, no user mentioned because this info is publicly available, not restricted to people involved :
```
make call-get-sm SM_ID=X
make call-get-sm-list
make call-get-balance
make call-cooldown-end-time
make call-security-period-config
make call-exec-time
make call-state
```

The following involve money-transfers :
```
make call-deposit USER_ID=X
make call-withdraw USER_ID=X
make call-swapAssets SM_ID=X
```

The following involve SM-participation:
```
make call-validate SM_ID=X
make call-desist SM_ID=X
```

The following involve declaration related actions :
```
make call-declare SM_ID=X
make call-veto USER_ID=X
```
The following are will-management related. Please check inside code of functions to check what params to update.
```c
make call-cancel USER_ID=X
// Update related, see code in Makefile to adjust what params are sent.
make call-create-new-will USER_ID=X
make call-update-sm-upd USER_ID=X
make call-update-sm-add USER_ID=X
make call-update-sm-del USER_ID=X
make call-update-sec-upd USER_ID=X
```
