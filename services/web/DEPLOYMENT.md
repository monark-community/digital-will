# Front-End Deployment on Vercel
## Requirements
1. Having a Github Repository
2. Front-end builds successfully

## Create your Vercel Project
1. While creating your project, put the front-end path as the root directory (services/web).
2. Name the project willchain-dev.
3. Follow this short tutorial to setup your project: https://www.youtube.com/watch?v=E8xaV6fiTaA.

After having created your project, you will have to change a few settings to make sure only the branch main is deployed automatically:
1. Settings -> Build and Deployment -> Ignored Build Step -> Select Only build production
2. Settings -> Environment -> Preview -> Branch Tracking -> Disable

Now, in order for your deployment to succeed and work, you will need to add these Environment Variables to your project:
In Settings -> Environment Variables, add these:

```
NEXT_PUBLIC_WILL_FACTORY_ADDRESS=0x05a61f96958B8c2b8DEcBC33b5676b6b780dCc28
NEXT_PUBLIC_API_URL=https://willchain-api-dev.onrender.com
NEXT_PUBLIC_RPC_URL=https://sepolia.rpc.pinax.network/v1/04f024d235225a2cfba7e61998bf0e7ed957eb5a7fbae143/
NEXT_PUBLIC_APP_ENV=development
```