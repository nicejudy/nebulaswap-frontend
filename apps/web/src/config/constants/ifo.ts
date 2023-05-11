import { ERC20Token, ChainId } from '@pancakeswap/sdk'
import { bscTokens, ethereumTokens } from '@pancakeswap/tokens'
import { CAKE_BNB_LP_MAINNET } from './lp'
import { Ifo } from './types'

export const cakeBnbLpToken = new ERC20Token(ChainId.BSC, CAKE_BNB_LP_MAINNET, 18, 'CAKE-BNB LP')

const ifos: Ifo[] = [
  {
    id: 'nebula',
    address: '0xC7d259712a26fa33a9a94cFB58964a67dAB27095',
    isActive: true,
    name: 'NEBULA',
    plannedStartTime: 1685448000, // Mon Jan 16 2023 12:00:00 UTC
    poolBasic: {
      raiseAmount: '$350,000',
    },
    poolUnlimited: {
      raiseAmount: '$1,050,000',
    },
    currency: bscTokens.cake,
    token: ethereumTokens.nebula,
    campaignId: '512100000',
    articleUrl:
      'https://pancakeswap.finance/voting/proposal/0x06598b682d9f33ec5ea0c2acf8eba13dea7c63fa08dd2c4dfd7bc7af16920d51',
    tokenOfferingPrice: 0.04,
    version: 3.2,
    twitterUrl: 'https://twitter.com/ESPL_GLOBAL',
    description:
      'The Esports Players League (ESPL) Arena is a platform that hosts global Esports tournaments and coordinates different aspects such as setting of tournament parameters, score-keeping, prize pool payouts via crypto and more.',
    vestingTitle: 'Use $ARENA to enjoy premium features on ESPL’s Esports tournament platform',
  },
]

export default ifos
