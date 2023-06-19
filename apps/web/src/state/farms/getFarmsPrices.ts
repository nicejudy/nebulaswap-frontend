import BigNumber from 'bignumber.js'
import { BIG_ONE, BIG_TWO, BIG_ZERO } from '@pancakeswap/utils/bigNumber'
import { filterFarmsByQuoteToken, SerializedFarm } from '@pancakeswap/farms'
import { ChainId } from '@pancakeswap/sdk'
import Farm from '@pancakeswap/uikit/src/widgets/Farm/components/FarmTable/FarmTokenInfo'
import { getBalanceAmount } from '@pancakeswap/utils/formatBalance'

const getFarmFromTokenSymbol = (
  farms: SerializedFarm[],
  tokenSymbol: string,
  preferredQuoteTokens?: string[],
): SerializedFarm => {
  const farmsWithTokenSymbol = farms.filter((farm) => farm.token.symbol === tokenSymbol)
  const filteredFarm = filterFarmsByQuoteToken(farmsWithTokenSymbol, preferredQuoteTokens)
  return filteredFarm
}

const getFarmBaseTokenPrice = (
  farm: SerializedFarm,
  quoteTokenFarm: SerializedFarm,
  nativePriceUSD: BigNumber,
  wNative: string,
  stable: string,
): BigNumber => {
  const hasTokenPriceVsQuote = Boolean(farm.tokenPriceVsQuote)

  if (farm.quoteToken.symbol === stable) {
    return hasTokenPriceVsQuote ? new BigNumber(farm.tokenPriceVsQuote) : BIG_ZERO
  }

  if (farm.quoteToken.symbol === wNative) {
    return hasTokenPriceVsQuote ? nativePriceUSD.times(farm.tokenPriceVsQuote) : BIG_ZERO
  }

  // We can only calculate profits without a quoteTokenFarm for BUSD/BNB farms
  if (!quoteTokenFarm) {
    return BIG_ZERO
  }

  // Possible alternative farm quoteTokens:
  // UST (i.e. MIR-UST), pBTC (i.e. PNT-pBTC), BTCB (i.e. bBADGER-BTCB), ETH (i.e. SUSHI-ETH)
  // If the farm's quote token isn't BUSD or WBNB, we then use the quote token, of the original farm's quote token
  // i.e. for farm PNT - pBTC we use the pBTC farm's quote token - BNB, (pBTC - BNB)
  // from the BNB - pBTC price, we can calculate the PNT - BUSD price
  if (quoteTokenFarm.quoteToken.symbol === wNative) {
    const quoteTokenInBusd = nativePriceUSD.times(quoteTokenFarm.tokenPriceVsQuote)
    return hasTokenPriceVsQuote && quoteTokenInBusd
      ? new BigNumber(farm.tokenPriceVsQuote).times(quoteTokenInBusd)
      : BIG_ZERO
  }

  if (quoteTokenFarm.quoteToken.symbol === stable) {
    const quoteTokenInBusd = quoteTokenFarm.tokenPriceVsQuote
    return hasTokenPriceVsQuote && quoteTokenInBusd
      ? new BigNumber(farm.tokenPriceVsQuote).times(quoteTokenInBusd)
      : BIG_ZERO
  }

  // Catch in case token does not have immediate or once-removed BUSD/WBNB quoteToken
  return BIG_ZERO
}

const getFarmQuoteTokenPrice = (
  farm: SerializedFarm,
  quoteTokenFarm: SerializedFarm,
  nativePriceUSD: BigNumber,
  wNative: string,
  stable: string,
): BigNumber => {
  if (farm.quoteToken.symbol === stable) {
    return BIG_ONE
  }

  if (farm.quoteToken.symbol === wNative) {
    return nativePriceUSD
  }

  if (!quoteTokenFarm) {
    return BIG_ZERO
  }

  if (quoteTokenFarm.quoteToken.symbol === wNative) {
    return quoteTokenFarm.tokenPriceVsQuote ? nativePriceUSD.times(quoteTokenFarm.tokenPriceVsQuote) : BIG_ZERO
  }

  if (quoteTokenFarm.quoteToken.symbol === stable) {
    return quoteTokenFarm.tokenPriceVsQuote ? new BigNumber(quoteTokenFarm.tokenPriceVsQuote) : BIG_ZERO
  }

  return BIG_ZERO
}

/**
 * @deprecated use packages/farms/src/farmPrice instead
 */

const getLpTokenPrice = (
  farm: SerializedFarm,
  tokenPriceBusd: BigNumber,
) => {
  // LP token price
  let lpTokenPrice = BIG_ZERO
  const lpTotalSupply = farm.lpTotalSupply ? new BigNumber(farm.lpTotalSupply) : BIG_ZERO
  const lpTotalInQuoteToken = farm.lpTotalInQuoteToken ? new BigNumber(farm.lpTotalInQuoteToken) : BIG_ZERO
  if (lpTotalSupply.gt(0) && lpTotalInQuoteToken.gt(0)) {
    const tokenAmountTotal = farm.tokenAmountTotal ? new BigNumber(farm.tokenAmountTotal) : BIG_ZERO
    const valueOfBaseTokenInFarm = tokenPriceBusd.times(tokenAmountTotal)
    // Double it to get overall value in LP
    const overallValueOfAllTokensInFarm = valueOfBaseTokenInFarm.times(BIG_TWO)
    // Divide total value of all tokens, by the number of LP tokens
    const totalLpTokens = getBalanceAmount(lpTotalSupply);
    // const totalLpTokens = lpTotalSupply.dividedBy(FixedNumber.from(getFullDecimalMultiplier(decimals)))
    lpTokenPrice = overallValueOfAllTokensInFarm.div(totalLpTokens)
  }

  return lpTokenPrice
}

const getFarmsPrices = (farms: SerializedFarm[], chainId: number) => {
  if (!nativeStableLpMap[chainId]) {
    throw new Error(`chainId ${chainId} not supported`)
  }

  const nativeStableFarm = farms.find(
    (farm) => farm.lpAddress.toLowerCase() === nativeStableLpMap[chainId].address.toLowerCase(),
  )
  const nativePriceUSD = nativeStableFarm.tokenPriceVsQuote ? BIG_ONE.div(nativeStableFarm.tokenPriceVsQuote) : BIG_ZERO
  const farmsWithPrices = farms.map((farm) => {
    const { wNative, stable } = nativeStableLpMap[chainId]
    const quoteTokenFarm =
      farm.quoteToken.symbol !== stable && farm.quoteToken.symbol !== wNative
        ? getFarmFromTokenSymbol(farms, farm.quoteToken.symbol, [wNative, stable])
        : null
    const tokenPriceBusd = getFarmBaseTokenPrice(farm, quoteTokenFarm, nativePriceUSD, wNative, stable)
    const quoteTokenPriceBusd = getFarmQuoteTokenPrice(farm, quoteTokenFarm, nativePriceUSD, wNative, stable)
    const lpTokenPriceBusd = getLpTokenPrice(farm, tokenPriceBusd)

    return {
      ...farm,
      tokenPriceBusd: tokenPriceBusd.toJSON(),
      quoteTokenPriceBusd: quoteTokenPriceBusd.toJSON(),
      lpTokenPrice: lpTokenPriceBusd.toJSON(),
    }
  })

  return farmsWithPrices
}

export default getFarmsPrices

const nativeStableLpMap = {
  [ChainId.ETHEREUM]: {
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
