import { BigNumber, FixedNumber } from '@ethersproject/bignumber'
import { formatUnits } from '@ethersproject/units'
import { Call, MultiCallV2 } from '@pancakeswap/multicall'
import { ChainId } from '@pancakeswap/sdk'
import { FIXED_TWO, FIXED_ZERO } from './const'
import { getFarmsPrices } from './farmPrices'
import { fetchPublicFarmsData } from './fetchPublicFarmData'
import { fetchStableFarmData } from './fetchStableFarmData'
import { isStableFarm, SerializedFarmConfig } from './types'
import { getFullDecimalMultiplier } from './getFullDecimalMultiplier'

const evmNativeStableLpMap = {
  [ChainId.ETHEREUM]: {
    // address: '0x2E8135bE71230c6B1B4045696d41C09Db0414226',
    address: '0x357DbDb8F654BC8Dff53D1f258997BCDa596F5D8',
    wNative: 'WETH',
    stable: 'USDC',
  },
  [ChainId.GOERLI]: {
    address: '0xf5bf0C34d3c428A74Ceb98d27d38d0036C587200',
    wNative: 'WETH',
    stable: 'tUSDC',
  },
  [ChainId.BSC]: {
    address: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    wNative: 'WBNB',
    stable: 'BUSD',
  },
  [ChainId.BSC_TESTNET]: {
    address: '0x4E96D2e92680Ca65D58A0e2eB5bd1c0f44cAB897',
    wNative: 'WBNB',
    stable: 'BUSD',
  },
}

export const getTokenAmount = (balance: FixedNumber, decimals: number) => {
  const tokenDividerFixed = FixedNumber.from(getFullDecimalMultiplier(decimals))
  return balance.divUnsafe(tokenDividerFixed)
}

export type FetchFarmsParams = {
  farms: SerializedFarmConfig[]
  multicallv2: MultiCallV2
  isTestnet: boolean
  masterChefAddress: string
  chainId: number
  totalRegularAllocPoint: BigNumber
  // totalSpecialAllocPoint: BigNumber
}

export async function farmV2FetchFarms({
  farms,
  multicallv2,
  isTestnet,
  masterChefAddress,
  chainId,
  totalRegularAllocPoint,
  // totalSpecialAllocPoint,
}: FetchFarmsParams) {
  const stableFarms = farms.filter(isStableFarm)

  const [stableFarmsResults, poolInfos, lpDataResults] = await Promise.all([
    fetchStableFarmData(stableFarms, chainId, multicallv2),
    fetchMasterChefData(farms, isTestnet, multicallv2, masterChefAddress),
    fetchPublicFarmsData(farms, chainId, multicallv2, masterChefAddress),
  ])

  const stableFarmsData = (stableFarmsResults as StableLpData[]).map(formatStableFarm)

  const stableFarmsDataMap = stableFarms.reduce<Record<number, FormatStableFarmResponse>>((map, farm, index) => {
    return {
      ...map,
      [farm.pid]: stableFarmsData[index],
    }
  }, {})

  const lpData = lpDataResults.map(formatClassicFarmResponse)

  const farmsData = farms.map((farm, index) => {
    try {
      return {
        ...farm,
        ...(stableFarmsDataMap[farm.pid]
          ? getStableFarmDynamicData({
              ...lpData[index],
              ...stableFarmsDataMap[farm.pid],
              token0Decimals: farm.token.decimals,
              token1Decimals: farm.quoteToken.decimals,
              price1: stableFarmsDataMap[farm.pid].price1,
            })
          : getClassicFarmsDynamicData({
              ...lpData[index],
              ...stableFarmsDataMap[farm.pid],
              token0Decimals: farm.token.decimals,
              token1Decimals: farm.quoteToken.decimals,
            })),
        ...getFarmAllocation({
          allocPoint: poolInfos[index]?.allocPoint,
          isRegular: poolInfos[index]?.isRegular,
          totalRegularAllocPoint,
          // totalSpecialAllocPoint,
        }),
      }
    } catch (error) {
      console.error(error, farm, index, {
        allocPoint: poolInfos[index]?.allocPoint,
        isRegular: poolInfos[index]?.isRegular,
        token0Decimals: farm.token.decimals,
        token1Decimals: farm.quoteToken.decimals,
        totalRegularAllocPoint,
        // totalSpecialAllocPoint,
      })
      throw error
    }
  })

  const farmsDataWithPrices = getFarmsPrices(farmsData, evmNativeStableLpMap[chainId], 18)

  return farmsDataWithPrices
}

const masterChefV2Abi = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { internalType: 'uint256', name: 'accCakePerShare', type: 'uint256' },
      { internalType: 'uint256', name: 'lastRewardBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBoostedShare', type: 'uint256' },
      { internalType: 'bool', name: 'isRegular', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'poolLength',
    outputs: [{ internalType: 'uint256', name: 'pools', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRegularAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSpecialAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bool', name: '_isRegular', type: 'bool' }],
    name: 'cakePerBlock',
    outputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const masterChefAbi = [{"inputs":[{"internalType":"contract NebulaToken","name":"_nebula","type":"address"},{"internalType":"address","name":"_devaddr","type":"address"},{"internalType":"uint256","name":"_nebulaPerBlock","type":"uint256"},{"internalType":"uint256","name":"_startBlock","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"EmergencyWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"pid","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"BONUS_MULTIPLIER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"contract IERC20","name":"_lpToken","type":"address"},{"internalType":"bool","name":"_withUpdate","type":"bool"}],"name":"add","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_devaddr","type":"address"}],"name":"dev","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"devaddr","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"enterStaking","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_from","type":"uint256"},{"internalType":"uint256","name":"_to","type":"uint256"}],"name":"getMultiplier","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"leaveStaking","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"massUpdatePools","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"migrate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"migrator","outputs":[{"internalType":"contract IMigratorChef","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nebula","outputs":[{"internalType":"contract NebulaToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nebulaPerBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],"name":"pendingNebula","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"poolInfo","outputs":[{"internalType":"contract IERC20","name":"lpToken","type":"address"},{"internalType":"uint256","name":"allocPoint","type":"uint256"},{"internalType":"uint256","name":"lastRewardBlock","type":"uint256"},{"internalType":"uint256","name":"accNebulaPerShare","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"poolLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_allocPoint","type":"uint256"},{"internalType":"bool","name":"_withUpdate","type":"bool"}],"name":"set","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IMigratorChef","name":"_migrator","type":"address"}],"name":"setMigrator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAllocPoint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"multiplierNumber","type":"uint256"}],"name":"updateMultiplier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],"name":"updatePool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"userInfo","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"rewardDebt","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]

const masterChefFarmCalls = (farm: SerializedFarmConfig, masterChefAddress: string) => {
  const { pid } = farm

  return pid || pid === 0
    ? {
        address: masterChefAddress,
        name: 'poolInfo',
        params: [pid],
      }
    : null
}

export const fetchMasterChefData = async (
  farms: SerializedFarmConfig[],
  isTestnet: boolean,
  multicallv2: MultiCallV2,
  masterChefAddress: string,
): Promise<any[]> => {
  try {
    const masterChefCalls = farms.map((farm) => masterChefFarmCalls(farm, masterChefAddress))
    const masterChefAggregatedCalls = masterChefCalls.filter((masterChefCall) => masterChefCall !== null) as Call[]

    const masterChefMultiCallResult = await multicallv2({
      // abi: masterChefV2Abi,
      abi: masterChefAbi,
      calls: masterChefAggregatedCalls,
      chainId: isTestnet ? ChainId.BSC_TESTNET : ChainId.ETHEREUM,
    })

    let masterChefChunkedResultCounter = 0
    return masterChefCalls.map((masterChefCall) => {
      if (masterChefCall === null) {
        return null
      }
      const data = masterChefMultiCallResult[masterChefChunkedResultCounter]
      masterChefChunkedResultCounter++
      return data
    })
  } catch (error) {
    console.error('MasterChef Pool info data error', error)
    throw error
  }
}

export const fetchMasterChefV2Data = async ({
  isTestnet,
  multicallv2,
  masterChefAddress,
}: {
  isTestnet: boolean
  multicallv2: MultiCallV2
  masterChefAddress: string
}) => {
  try {
    const [[poolLength], [totalRegularAllocPoint], [cakePerBlock]] = await multicallv2<
      [[BigNumber], [BigNumber], [BigNumber], [BigNumber]]
    >({
      // abi: masterChefV2Abi,
      abi: masterChefAbi,
      calls: [
        {
          address: masterChefAddress,
          name: 'poolLength',
        },
        {
          address: masterChefAddress,
          name: 'totalAllocPoint',
        },
        // {
        //   address: masterChefAddress,
        //   name: 'totalSpecialAllocPoint',
        // },
        {
          address: masterChefAddress,
          name: 'nebulaPerBlock',
          // params: [true],
        },
      ],
      chainId: isTestnet ? ChainId.BSC_TESTNET : ChainId.ETHEREUM,
    })

    return {
      poolLength,
      totalRegularAllocPoint,
      // totalSpecialAllocPoint,
      cakePerBlock,
    }
  } catch (error) {
    console.error('Get MasterChef data error', error)
    throw error
  }
}

type StableLpData = [balanceResponse, balanceResponse, balanceResponse, balanceResponse]

type FormatStableFarmResponse = {
  tokenBalanceLP: FixedNumber
  quoteTokenBalanceLP: FixedNumber
  price1: BigNumber
}

const formatStableFarm = (stableFarmData: StableLpData): FormatStableFarmResponse => {
  const [balance1, balance2, _, _price1] = stableFarmData
  return {
    tokenBalanceLP: FixedNumber.from(balance1[0]),
    quoteTokenBalanceLP: FixedNumber.from(balance2[0]),
    price1: _price1[0],
  }
}

const getStableFarmDynamicData = ({
  lpTokenBalanceMC,
  lpTotalSupply,
  quoteTokenBalanceLP,
  tokenBalanceLP,
  token0Decimals,
  token1Decimals,
  price1,
}: FormatClassicFarmResponse & {
  token1Decimals: number
  token0Decimals: number
  price1: BigNumber
}) => {
  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = getTokenAmount(tokenBalanceLP, token0Decimals)
  const quoteTokenAmountTotal = getTokenAmount(quoteTokenBalanceLP, token1Decimals)

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio =
    !lpTotalSupply.isZero() && !lpTokenBalanceMC.isZero() ? lpTokenBalanceMC.divUnsafe(lpTotalSupply) : FIXED_ZERO

  const tokenPriceVsQuote = formatUnits(price1, token1Decimals)

  // Amount of quoteToken in the LP that are staked in the MC
  const quoteTokenAmountMcFixed = quoteTokenAmountTotal.mulUnsafe(lpTokenRatio)

  // Amount of token in the LP that are staked in the MC
  const tokenAmountMcFixed = tokenAmountTotal.mulUnsafe(lpTokenRatio)

  const quoteTokenAmountMcFixedByTokenAmount = tokenAmountMcFixed.mulUnsafe(FixedNumber.from(tokenPriceVsQuote))

  const lpTotalInQuoteToken = quoteTokenAmountMcFixed.addUnsafe(quoteTokenAmountMcFixedByTokenAmount)

  return {
    tokenAmountTotal: tokenAmountTotal.toString(),
    quoteTokenAmountTotal: quoteTokenAmountTotal.toString(),
    lpTotalSupply: lpTotalSupply.toString(),
    lpTotalInQuoteToken: lpTotalInQuoteToken.toString(),
    tokenPriceVsQuote,
  }
}

type balanceResponse = [BigNumber]
type decimalsResponse = [number]

export type ClassicLPData = [
  balanceResponse,
  balanceResponse,
  balanceResponse,
  balanceResponse,
  decimalsResponse,
  decimalsResponse,
]

type FormatClassicFarmResponse = {
  tokenBalanceLP: FixedNumber
  quoteTokenBalanceLP: FixedNumber
  lpTokenBalanceMC: FixedNumber
  lpTotalSupply: FixedNumber
}

const formatClassicFarmResponse = (farmData: ClassicLPData): FormatClassicFarmResponse => {
  const [tokenBalanceLP, quoteTokenBalanceLP, lpTokenBalanceMC, lpTotalSupply] = farmData
  return {
    tokenBalanceLP: FixedNumber.from(tokenBalanceLP[0]),
    quoteTokenBalanceLP: FixedNumber.from(quoteTokenBalanceLP[0]),
    lpTokenBalanceMC: FixedNumber.from(lpTokenBalanceMC[0]),
    lpTotalSupply: FixedNumber.from(lpTotalSupply[0]),
  }
}

interface FarmAllocationParams {
  allocPoint?: BigNumber
  isRegular?: boolean
  totalRegularAllocPoint: BigNumber
  // totalSpecialAllocPoint: BigNumber
}

const getFarmAllocation = ({
  allocPoint,
  isRegular,
  totalRegularAllocPoint,
  // totalSpecialAllocPoint,
}: FarmAllocationParams) => {
  const _allocPoint = allocPoint ? FixedNumber.from(allocPoint) : FIXED_ZERO
  // const totalAlloc = isRegular ? totalRegularAllocPoint : totalSpecialAllocPoint
  const totalAlloc = totalRegularAllocPoint
  const poolWeight =
    !totalAlloc.isZero() && !_allocPoint.isZero() ? _allocPoint.divUnsafe(FixedNumber.from(totalAlloc)) : FIXED_ZERO

  return {
    poolWeight: poolWeight.toString(),
    multiplier: !_allocPoint.isZero() ? `${+_allocPoint.divUnsafe(FixedNumber.from(10)).toString()}X` : `0X`,
  }
}

const getClassicFarmsDynamicData = ({
  lpTokenBalanceMC,
  lpTotalSupply,
  quoteTokenBalanceLP,
  tokenBalanceLP,
  token0Decimals,
  token1Decimals,
}: FormatClassicFarmResponse & {
  token0Decimals: number
  token1Decimals: number
  lpTokenStakedAmount?: string
}) => {
  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = getTokenAmount(tokenBalanceLP, token0Decimals)
  const quoteTokenAmountTotal = getTokenAmount(quoteTokenBalanceLP, token1Decimals)

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio =
    !lpTotalSupply.isZero() && !lpTokenBalanceMC.isZero() ? lpTokenBalanceMC.divUnsafe(lpTotalSupply) : FIXED_ZERO

  // // Amount of quoteToken in the LP that are staked in the MC
  const quoteTokenAmountMcFixed = quoteTokenAmountTotal.mulUnsafe(lpTokenRatio)

  // // Total staked in LP, in quote token value
  const lpTotalInQuoteToken = quoteTokenAmountMcFixed.mulUnsafe(FIXED_TWO)

  return {
    tokenAmountTotal: tokenAmountTotal.toString(),
    quoteTokenAmountTotal: quoteTokenAmountTotal.toString(),
    lpTotalSupply: lpTotalSupply.toString(),
    lpTotalInQuoteToken: lpTotalInQuoteToken.toString(),
    tokenPriceVsQuote:
      !quoteTokenAmountTotal.isZero() && !tokenAmountTotal.isZero()
        ? quoteTokenAmountTotal.divUnsafe(tokenAmountTotal).toString()
        : FIXED_ZERO.toString(),
    lpTokenStakedAmount: lpTokenBalanceMC.toString(),
  }
}
