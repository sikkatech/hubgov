const { SigningCosmosClient, coins, LcdClient, setupGovExtension } = require("@cosmjs/launchpad");

window.onload = async () => {
    // Keplr extension injects the offline signer that is compatible with cosmJS.
    // You can get this offline signer from `window.getOfflineSigner(chainId:string)` after load event.
    // And it also injects the helper function to `window.keplr`.
    // If `window.getOfflineSigner` or `window.keplr` is null, Keplr extension may be not installed on browser.
    if (!window.getOfflineSigner || !window.keplr) {
        alert("Please install and use keplr extension");
    } else {
        if (window.keplr.experimentalSuggestChain) {
            try {
                // Keplr v0.6.4 introduces an experimental feature that supports the feature to suggests the chain from a webpage.
                // cosmoshub-3 is integrated to Keplr so the code should return without errors.
                // The code below is not needed for cosmoshub-3, but may be helpful if you’re adding a custom chain.
                // If the user approves, the chain will be added to the user's Keplr extension.
                // If the user rejects it or the suggested chain information doesn't include the required fields, it will throw an error.
                // If the same chain id is already registered, it will resolve and not require the user interactions.
                await window.keplr.experimentalSuggestChain({
                    // Chain-id of the Cosmos SDK chain.
                    chainId: "cosmoshub-3",
                    // The name of the chain to be displayed to the user.
                    chainName: "Cosmos",
                    // RPC endpoint of the chain.
                    rpc: "https://node-cosmoshub-3.keplr.app/rpc",
                    // REST endpoint of the chain.
                    rest: "https://node-cosmoshub-3.keplr.app/rest",
                    // Staking coin information
                    stakeCurrency: {
                        // Coin denomination to be displayed to the user.
                        coinDenom: "ATOM",
                        // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                        coinMinimalDenom: "uatom",
                        // # of decimal points to convert minimal denomination to user-facing denomination.
                        coinDecimals: 6,
                        // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                        // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                        // coinGeckoId: ""
                    },
                    // (Optional) If you have a wallet webpage used to stake the coin then provide the url to the website in `walletUrlForStaking`.
                    // The 'stake' button in Keplr extension will link to the webpage.
                    // walletUrlForStaking: "",
                    // The BIP44 path.
                    bip44: {
                        // You can only set the coin type of BIP44.
                        // 'Purpose' is fixed to 44.
                        coinType: 118,
                    },
                    // Bech32 configuration to show the address to user.
                    // This field is the interface of
                    // {
                    //   bech32PrefixAccAddr: string;
                    //   bech32PrefixAccPub: string;
                    //   bech32PrefixValAddr: string;
                    //   bech32PrefixValPub: string;
                    //   bech32PrefixConsAddr: string;
                    //   bech32PrefixConsPub: string;
                    // }
                    bech32Config: {
                        bech32PrefixAccAddr: "cosmos",
                        bech32PrefixAccPub: "cosmospub",
                        bech32PrefixValAddr: "cosmosvaloper",
                        bech32PrefixValPub: "cosmosvaloperpub",
                        bech32PrefixConsAddr: "cosmosvalcons",
                        bech32PrefixConsPub: "cosmosvalconspub"
                    },
                    // List of all coin/tokens used in this chain.
                    currencies: [{
                        // Coin denomination to be displayed to the user.
                        coinDenom: "ATOM",
                        // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                        coinMinimalDenom: "uatom",
                        // # of decimal points to convert minimal denomination to user-facing denomination.
                        coinDecimals: 6,
                        // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                        // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                        // coinGeckoId: ""
                    }],
                    // List of coin/tokens used as a fee token in this chain.
                    feeCurrencies: [{
                        // Coin denomination to be displayed to the user.
                        coinDenom: "ATOM",
                        // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                        coinMinimalDenom: "uatom",
                        // # of decimal points to convert minimal denomination to user-facing denomination.
                        coinDecimals: 6,
                        // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                        // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                        // coinGeckoId: ""
                    }],
                    // (Optional) The number of the coin type.
                    // This field is only used to fetch the address from ENS.
                    // Ideally, it is recommended to be the same with BIP44 path's coin type.
                    // However, some early chains may choose to use the Cosmos Hub BIP44 path of '118'.
                    // So, this is separated to support such chains.
                    coinType: 118,
                    // (Optional) This is used to set the fee of the transaction.
                    // If this field is not provided, Keplr extension will set the default gas price as (low: 0.01, average: 0.025, high: 0.04).
                    // Currently, Keplr doesn't support dynamic calculation of the gas prices based on on-chain data.
                    // Make sure that the gas prices are higher than the minimum gas prices accepted by chain validators and RPC/REST endpoint.
                    gasPriceStep: {
                        low: 0.01,
                        average: 0.025,
                        high: 0.04
                    }
                });
            } catch {
                alert("Failed to suggest the chain");
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }

    const chainId = "cosmoshub-3";

    // You should request Keplr to enable the wallet.
    // This method will ask the user whether or not to allow access if they haven't visited this website.
    // Also, it will request user to unlock the wallet if the wallet is locked.
    // If you don't request enabling before usage, there is no guarantee that other methods will work.
    await window.keplr.enable(chainId);

    const apiUrl = "https://node-cosmoshub-3.keplr.app/rest";

    const client = LcdClient.withExtensions(
        { apiUrl },
        setupGovExtension,
    );

    const proposals = await client.gov.proposals();

    var activeProposals = [];

    for (proposal of proposals.result) {
        if (proposal["proposal_status"] == "VotingPeriod") {
            activeProposals.push(proposal);
        }
    }

    var proplist = document.getElementById("prop");

    for (prop of activeProposals) {
        var option = document.createElement("option");
        option.text = prop["id"] + " - " + prop["content"]["value"]["title"];
        option.value = prop["id"];
        proplist.add(option);
    }

    $("#loader").hide();
};

document.sendForm.onsubmit = () => {
    let props = $("#prop").val();
    let option = $("#option").val();

    (async () => {
        // See above.
        const chainId = "cosmoshub-3";
        await window.keplr.enable(chainId);
        const offlineSigner = window.getOfflineSigner(chainId);

        const accounts = await offlineSigner.getAccounts();

        // Initialize the gaia api with the offline signer that is injected by Keplr extension.
        const cosmJS = new SigningCosmosClient(
            "https://node-cosmoshub-3.keplr.app/rest",
            accounts[0].address,
            offlineSigner,
        );

        var voteMsgs = [];

        for (prop of props) {
            voteMsgs.push({
                type: "cosmos-sdk/MsgVote",
                value: {
                    proposal_id: prop,
                    voter: cosmJS.senderAddress,
                    option: option,
                },
            })
        }

        const fee = {
            amount: coins(0, "uatom"),
            gas: "400000",
        };

        $("#loader").show();

        const result = await cosmJS.signAndBroadcast(voteMsgs, fee, "");

        $("#loader").hide();

        console.log(result); 

        if (result.code !== undefined &&
            result.code !== 0) {
            alert("Failed to send tx: " + result.log || result.rawLog);
        } else {
            alert("Succeed to send tx");
        }
    })();

    return false;
};
