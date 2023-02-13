import {
  Box,
  Button,
  Flex,
  InjectedModalProps,
  LinkExternal,
  Message,
  Skeleton,
  Text,
  CopyAddress,
} from '@pancakeswap/uikit'
import { ChainId, WNATIVE } from '@pancakeswap/sdk'
import { FetchStatus } from 'config/constants/types'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useTranslation } from '@pancakeswap/localization'
import useAuth from 'hooks/useAuth'
import useNativeCurrency from 'hooks/useNativeCurrency'
import useTokenBalance, { useGetCakeBalance } from 'hooks/useTokenBalance'
import { ChainLogo } from 'components/Logo/ChainLogo'
import NextLink from 'next/link'

import { useProfile } from 'state/profile/hooks'

import { getBlockExploreLink, getBlockExploreName } from 'utils'
import { formatBigNumber, getFullDisplayBalance } from '@pancakeswap/utils/formatBalance'
import { useBalance } from 'wagmi'
import CakeBenefitsCard from './CakeBenefitsCard'

const COLORS = {
  ETH: '#627EEA',
  BNB: '#14151A',
}

interface WalletInfoProps {
  hasLowNativeBalance: boolean
  switchView: (newIndex: number) => void
  onDismiss: InjectedModalProps['onDismiss']
}

const WalletInfo: React.FC<WalletInfoProps> = ({ hasLowNativeBalance, onDismiss }) => {
  const { t } = useTranslation()
  const { account, chainId, chain } = useActiveWeb3React()
  const isBSC = chainId === ChainId.BSC
  const bnbBalance = useBalance({ address: account, chainId: ChainId.BSC })
  const nativeBalance = useBalance({ address: account, enabled: !isBSC })
  const native = useNativeCurrency()
  const wNativeToken = !isBSC ? WNATIVE[chainId] : null
  const wBNBToken = WNATIVE[ChainId.BSC]
  const { balance: wNativeBalance, fetchStatus: wNativeFetchStatus } = useTokenBalance(wNativeToken?.address)
  const { balance: wBNBBalance, fetchStatus: wBNBFetchStatus } = useTokenBalance(wBNBToken?.address, true)
  const { balance: cakeBalance, fetchStatus: cakeFetchStatus } = useGetCakeBalance()
  const accountEllipsis = account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : null;
  const { logout } = useAuth()

  const { isInitialized, isLoading, profile } = useProfile()
  const hasProfile = isInitialized && !!profile

  const handleLogout = () => {
    onDismiss?.()
    logout()
  }

  return (
    <>
      {/* <Text color="secondary" fontSize="12px" textTransform="uppercase" fontWeight="bold" mb="8px"> */}
      <Text color="secondary" fontSize="14px" fontWeight="bold">
        {t('Connected with')} {accountEllipsis}
      </Text>
      {/* <CopyAddress tooltipMessage={t('Copied')} account={account} mb="24px" /> */}
      {/* {hasLowNativeBalance && (
        <Message variant="warning" mb="24px">
          <Box>
            <Text fontWeight="bold">
              {t('%currency% Balance Low', {
                currency: native.symbol,
              })}
            </Text>
            <Text as="p">
              {t('You need %currency% for transaction fees.', {
                currency: native.symbol,
              })}
            </Text>
          </Box>
        </Message>
      )} */}
      {/* {!isBSC && chain && (
        <Box mb="12px">
          <Flex justifyContent="space-between" alignItems="center" mb="8px">
            <Flex bg={COLORS.ETH} borderRadius="16px" pl="4px" pr="8px" py="2px">
              <ChainLogo chainId={chain.id} />
              <Text color="white" ml="4px">
                {chain.name}
              </Text>
            </Flex>
            <LinkExternal href={getBlockExploreLink(account, 'address', chainId)}>
              {getBlockExploreName(chainId)}
            </LinkExternal>
          </Flex>
          <Flex alignItems="center" justifyContent="space-between">
            <Text color="textSubtle">
              {native.symbol} {t('Balance')}
            </Text>
            {!nativeBalance.isFetched ? (
              <Skeleton height="22px" width="60px" />
            ) : (
              <Text>{formatBigNumber(nativeBalance.data.value, 6)}</Text>
            )}
          </Flex>
          {wNativeBalance.gt(0) && (
            <Flex alignItems="center" justifyContent="space-between">
              <Text color="textSubtle">
                {wNativeToken.symbol} {t('Balance')}
              </Text>
              {wNativeFetchStatus !== FetchStatus.Fetched ? (
                <Skeleton height="22px" width="60px" />
              ) : (
                <Text>{getFullDisplayBalance(wNativeBalance, wNativeToken.decimals, 6)}</Text>
              )}
            </Flex>
          )}
        </Box>
      )} */}
      <Box mb="8px">
        <Flex justifyContent="space-between" alignItems="center" mb="8px">
          {/* <Flex bg={COLORS.BNB} borderRadius="16px" pl="4px" pr="8px" py="2px">
            <ChainLogo chainId={ChainId.BSC} />
            <Text color="white" ml="4px">
              BNB Smart Chain
            </Text>
          </Flex> */}
          <CopyAddress tooltipMessage={t('Copied')} account={account} />
          <LinkExternal isBscScan href={getBlockExploreLink(account, 'address', ChainId.BSC)} mr="12px">
            {/* {getBlockExploreName(ChainId.BSC)} */}
            View on explorer
          </LinkExternal>
        </Flex>
        <Flex justifyContent="space-between" alignItems="center" mb="8px">
          <NextLink href={`/profile/${account?.toLowerCase()}`} passHref onClick={onDismiss}>
            <Text color="primary" fontSize="12px" fontWeight="bold" ml="12px">
              {t('Your NFTs')}
            </Text>
          </NextLink>
          {!hasProfile && <NextLink href="/create-profile" passHref onClick={onDismiss}>
            <Text color="primary" fontSize="12px" fontWeight="bold" mr="12px">
              {t('Make a Profile')}
            </Text>
          </NextLink>}
          {hasProfile && <NextLink href={`/profile/${account?.toLowerCase()}/achievements`} passHref onClick={onDismiss}>
            <Text color="primary" fontSize="12px" fontWeight="bold" mr="12px">
              {t('View Profile')}
            </Text>
          </NextLink>}
        </Flex>
        {/* <Flex alignItems="center" justifyContent="space-between">
          <Text color="textSubtle">BNB {t('Balance')}</Text>
          {!bnbBalance.isFetched ? (
            <Skeleton height="22px" width="60px" />
          ) : (
            <Text>{formatBigNumber(bnbBalance.data.value, 6)}</Text>
          )}
        </Flex>
        {wBNBBalance.gt(0) && (
          <Flex alignItems="center" justifyContent="space-between">
            <Text color="textSubtle">WBNB {t('Balance')}</Text>
            {wBNBFetchStatus !== FetchStatus.Fetched ? (
              <Skeleton height="22px" width="60px" />
            ) : (
              <Text>{getFullDisplayBalance(wBNBBalance, wBNBToken.decimals, 6)}</Text>
            )}
          </Flex>
        )}
        <Flex alignItems="center" justifyContent="space-between">
          <Text color="textSubtle">{t('CAKE Balance')}</Text>
          {cakeFetchStatus !== FetchStatus.Fetched ? (
            <Skeleton height="22px" width="60px" />
          ) : (
            <Text>{formatBigNumber(cakeBalance, 3)}</Text>
          )}
        </Flex> */}
      </Box>
      {/* <CakeBenefitsCard onDismiss={onDismiss} /> */}
      <Button variant="secondary" width="100%" minHeight={48} onClick={handleLogout} my="12px">
        {t('Disconnect Wallet')}
      </Button>
    </>
  )
}

export default WalletInfo
