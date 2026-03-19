/* These are how the raw messages are received from the substream. 
This is to help create the corresponding interfaces in the backend.*/

const rawMessagesExample1 = { // ok
    events: {
        willfactoryEvtWillChainWillCreateds: [ // not listening to this event.
            {
                evtTxHash: '31b42752b1717197e9cc20b10d67b40e246f7df8e0a10efd9d284742d5a9669e',
                evtIndex: 53,
                evtBlockTime: '2026-02-26T04:21:36Z',
                evtBlockNumber: '10338225',
                willAddress: 'NtHFls8hqvHs90U4u89VCxRiMlw=',
                mpAddress: '2uT/xxLuaD35BWVTjVewzpeOOR8='
            },
        ],
    },
    calls: {
        willfactoryCallCreateWills: [
            {
                callTxHash: '31b42752b1717197e9cc20b10d67b40e246f7df8e0a10efd9d284742d5a9669e',
                callBlockTime: '2026-02-26T04:21:36Z',
                callBlockNumber: '10338225',
                callOrdinal: '2001',
                callSuccess: true,
                owner: '2uT/xxLuaD35BWVTjVewzpeOOR8=', // mpAddress
                outputParam0: 'NtHFls8hqvHs90U4u89VCxRiMlw=', // willaddress important de vérifier qu'il existe bien avant de le créer dans la db (au cas ou il y a un Revert)
                newSmList: [
                    { smAddress: 'HTDf1aO/AvUElLT0wOlIxycTzn8=', votePower: 1 },
                    { smAddress: '3n535brJxEnk6/IESzp7XMTb5Tk=', votePower: 1 }
                ],
                securityPeriodConfig: { minSecurityPeriod: '604800', maxSecurityPeriod: '2592000' }
            }
        ]
    }
}

// ==================== MESSAGE 1 ====================
const message1 = {
    events: {
        willEvtWillChainSmValidateds: [
            {
                evtTxHash: '4fd78f5e066c85b331319200be5789ae56d4a8a03cba56f77a40fea2df1c09aa',
                evtIndex: 6,
                evtBlockTime: '2026-03-02T21:21:00Z',
                evtBlockNumber: '10371103',
                evtAddress: '36d1c596cf21aaf1ecf74538bbcf550b1462325c', // will address
                smAddress: 'HTDf1aO/AvUElLT0wOlIxycTzn8='
            }
        ]
    },
    calls: {
        willCallValidateSms: [   // not listening to this call
            {
                callTxHash: '4fd78f5e066c85b331319200be5789ae56d4a8a03cba56f77a40fea2df1c09aa',
                callBlockTime: '2026-03-02T21:21:00Z',
                callBlockNumber: '10371103',
                callOrdinal: '286',
                callSuccess: true,
                callAddress: '36d1c596cf21aaf1ecf74538bbcf550b1462325c'
            }
        ]
    }
};

// ==================== MESSAGE 2 ====================
const message2 = {
    events: {
        willEvtWillChainAssetsWithdrawns: [
            {
                evtTxHash: 'd2afef3e8b6b68c3f8942bc6d37873e744ee77ca263bd52d1dc0899150f0479d',
                evtIndex: 27,
                evtBlockTime: '2026-03-05T01:40:48Z',
                evtBlockNumber: '10386355',
                evtAddress: '04adaf0aaec695773c670615f2f3dd2d96cb00b6', //willAddress
                amount: '10000000000000000'
            }
        ]
    },
    calls: {
        willCallWithdraws: [ // not listening to this call
            {
                callTxHash: 'd2afef3e8b6b68c3f8942bc6d37873e744ee77ca263bd52d1dc0899150f0479d',
                callBlockTime: '2026-03-05T01:40:48Z',
                callBlockNumber: '10386355',
                callOrdinal: '1151',
                callSuccess: true,
                callAddress: '04adaf0aaec695773c670615f2f3dd2d96cb00b6',
                amount: '10000000000000000'
            }
        ]
    }
};

// ==================== MESSAGE 3 ====================
const message3 = { // ok
    events: {
        willEvtWillChainSmValidateds: [
            {
                evtTxHash: '4bde4d7779c7312d788f859dcc9292ca97cc76bcf139cf4f6b3f6e437dc7e72b',
                evtIndex: 20,
                evtBlockTime: '2026-03-02T21:23:36Z',
                evtBlockNumber: '10371116',
                evtAddress: '36d1c596cf21aaf1ecf74538bbcf550b1462325c', // will address
                smAddress: '3n535brJxEnk6/IESzp7XMTb5Tk='
            }
        ],
        willEvtWillChainWillActivateds: [
            {
                evtTxHash: '4bde4d7779c7312d788f859dcc9292ca97cc76bcf139cf4f6b3f6e437dc7e72b',
                evtIndex: 21,
                evtBlockTime: '2026-03-02T21:23:36Z',
                evtBlockNumber: '10371116',
                evtAddress: '36d1c596cf21aaf1ecf74538bbcf550b1462325c' // will address
            }
        ]
    },
    calls: {
        willCallValidateSms: [ // no listening to this call - OK
            {
                callTxHash: '4bde4d7779c7312d788f859dcc9292ca97cc76bcf139cf4f6b3f6e437dc7e72b',
                callBlockTime: '2026-03-02T21:23:36Z',
                callBlockNumber: '10371116',
                callOrdinal: '453',
                callSuccess: true,
                callAddress: '36d1c596cf21aaf1ecf74538bbcf550b1462325c'
            }
        ]
    }
};

// ==================== MESSAGE 4 ====================
const message4 = { // ok
    events: {
        willEvtWillChainAssetsDepositeds: [
            {
                evtTxHash: 'ea7c49f0f3329aa3e4e77d5a1817c30ae8cb3c4329d7981ca49d36e8cbec3218',
                evtIndex: 14,
                evtBlockTime: '2026-03-02T21:41:24Z',
                evtBlockNumber: '10371202',
                evtAddress: '36d1c596cf21aaf1ecf74538bbcf550b1462325c', //will address
                amount: '1000000000000000' //0.001 sepolia ETH 
            }
        ]
    },
    calls: {
        willCallDeposits: [ // not listening to this call
            {
                callTxHash: 'ea7c49f0f3329aa3e4e77d5a1817c30ae8cb3c4329d7981ca49d36e8cbec3218',
                callBlockTime: '2026-03-02T21:41:24Z',
                callBlockNumber: '10371202',
                callOrdinal: '653',
                callSuccess: true,
                callAddress: '36d1c596cf21aaf1ecf74538bbcf550b1462325c'
            }
        ]
    }
};

// ==================== MESSAGE 5 ====================
// this happened when we updated the will by removing 1 sm and creating a new one
const message5 = {
    events: {
        willEvtWillChainSmAddeds: [
            {
                evtTxHash: 'fc60e90e3cdeab7a1568126795af39de2d0aa4c6900198696b10fce40ebc41cf',
                evtIndex: 39,
                evtBlockTime: '2026-03-08T15:21:12Z',
                evtBlockNumber: '10409365',
                evtAddress: '38a804b8e998105758f9ebe53b49d9f6d1007f1f',
                smAddress: 'kq1evrdESJBSaVwDvvPeJBF+yLQ=',
                votePower: '1'
            }
        ],
        willEvtWillChainSmRemoveds: [
            {
                evtTxHash: 'fc60e90e3cdeab7a1568126795af39de2d0aa4c6900198696b10fce40ebc41cf',
                evtIndex: 40,
                evtBlockTime: '2026-03-08T15:21:12Z',
                evtBlockNumber: '10409365',
                evtAddress: '38a804b8e998105758f9ebe53b49d9f6d1007f1f',
                smAddress: '3n535brJxEnk6/IESzp7XMTb5Tk='
            }
        ]
    },
    calls: {
        willCallUpdateWills: [ // no need to listen to this call
            {
                callTxHash: 'fc60e90e3cdeab7a1568126795af39de2d0aa4c6900198696b10fce40ebc41cf',
                callBlockTime: '2026-03-08T15:21:12Z',
                callBlockNumber: '10409365',
                callOrdinal: '1371',
                callSuccess: true,
                callAddress: '38a804b8e998105758f9ebe53b49d9f6d1007f1f',
                deletedSmList: [ '3n535brJxEnk6/IESzp7XMTb5Tk=' ]
            }
        ]
    }
};

// ==================== MESSAGE 6 ====================
// Will canceled and cancel call example (2026-03-08)
const message6 = {
    events: {
        willEvtWillChainWillCanceleds: [
            {
                evtTxHash: '4983417446a1b24806ba0571f40151e13c26401a41b508e58fdfddc0a22eb595',
                evtIndex: 35,
                evtBlockTime: '2026-03-08T15:10:12Z',
                evtBlockNumber: '10409322',
                evtAddress: 'b74c167ab74d53d8be620bbe0c278d1c4a978247'
            }
        ]
    },
    calls: {
        willCallCancelWills: [
            {
                callTxHash: '4983417446a1b24806ba0571f40151e13c26401a41b508e58fdfddc0a22eb595',
                callBlockTime: '2026-03-08T15:10:12Z',
                callBlockNumber: '10409322',
                callOrdinal: '1282',
                callSuccess: true,
                callAddress: 'b74c167ab74d53d8be620bbe0c278d1c4a978247'
            }
        ]
    }
};
