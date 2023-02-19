// import NftMarket from 'views/Nft/market/Home'

// const NftMarketPage = () => {
//   return <NftMarket />
// }

// export default NftMarketPage

import { GetStaticProps, InferGetStaticPropsType } from 'next'
// eslint-disable-next-line camelcase
import { SWRConfig, unstable_serialize } from 'swr'
import { getCollection } from 'state/nftMarket/helpers'
import CollectionPageRouter from 'views/Nft/market/Collection/CollectionPageRouter'

const CollectionPage = ({ fallback = {} }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <SWRConfig
      value={{
        fallback,
      }}
    >
      <CollectionPageRouter />
    </SWRConfig>
  )
}

// export const getStaticPaths: GetStaticPaths = async () => {
//   return {
//     fallback: true,
//     paths: [],
//   }
// }

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // const { collectionAddress } = params
  // const collectionAddress = "0xf31FC9767aDd3194FD8cF632Ae4328cd64349E6e"
  const collectionAddress = "0x6f1Dc8a50489C96B6c09bb2aEc28c4043fB1A802"
  if (typeof collectionAddress !== 'string') {
    return {
      notFound: true,
    }
  }

  try {
    const collectionData = await getCollection(collectionAddress)
    console.log(collectionData)

    if (collectionData) {
      return {
        props: {
          fallback: {
            [unstable_serialize(['nftMarket', 'collections', collectionAddress.toLowerCase()])]: { ...collectionData },
          },
        },
        revalidate: 60 * 60 * 6, // 6 hours
      }
    }
    return {
      notFound: true,
      revalidate: 60,
    }
  } catch (error) {
    return {
      notFound: true,
      revalidate: 60,
    }
  }
}

export default CollectionPage
