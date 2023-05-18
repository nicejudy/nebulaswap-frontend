import { DefaultSeoProps } from 'next-seo'

export const SEO: DefaultSeoProps = {
  titleTemplate: '%s | NebulaSwap',
  defaultTitle: 'NebulaSwap',
  description:
    'Cheaper and faster than Uniswap? Discover NebulaSwap, the leading DEX on Arbitrum with the best farms in DeFi.',
  twitter: {
    cardType: 'summary_large_image',
    handle: '@NebulaSwap',
    site: '@NebulaSwap',
  },
  openGraph: {
    title: 'NebulaSwap - A next evolution DeFi exchange on Arbitrum',
    description:
      'The most popular AMM on Arbitrum! Earn NEBULA through yield farming, then stake it in Pools to earn more tokens! We provide ASTRO NFTs.',
    images: [{ url: '/images/home/lunar-bunny/astronaut-moon.png' }],
  },
}
