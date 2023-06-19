import { vars } from "@pancakeswap/ui/css/vars.css";
import { useIsMounted } from "@pancakeswap/hooks";
import React from "react";
import { Box, Flex } from "../Box";
import { Link as ALink } from "../Link";
import Link from "next/link";
import {
  StyledFooter,
  StyledIconMobileContainer,
  StyledList,
  StyledListItem,
  StyledSocialLinks,
  StyledText,
  StyledToolsContainer,
} from "./styles";

import { Button } from "../Button";
import CakePrice from "../CakePrice/CakePrice";
import LangSelector from "../LangSelector/LangSelector";
import { ArrowForwardIcon, LogoWithTextIcon } from "../Svg";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { FooterProps } from "./types";
import { SkeletonV2 } from "../Skeleton";
import Logo from "../../widgets/Menu/components/Logo";
import { MOBILE_MENU_HEIGHT } from "../../widgets/Menu/config";
import { Text } from "../Text";

const MenuItem: React.FC<React.PropsWithChildren<FooterProps>> = ({
  items,
  isDark,
  toggleTheme,
  currentLang,
  langs,
  setLang,
  cakePriceUsd,
  buyCakeLabel,
  buyCakeLink,
  ...props
}) => {
  const isMounted = useIsMounted();
  return (
    <StyledFooter
      data-theme="dark"
      p={["20px 12px", null, "20px 40px 20px 40px"]}
      mb={[`${MOBILE_MENU_HEIGHT}px`, null, null, "0px"]}
      position="relative"
      {...props}
      justifyContent="center"
    >
      <Flex flexDirection="column" width={["100%", null, "1200px;"]}>
        {/* <StyledIconMobileContainer display={["block", null, "none"]}>
          <Logo href={"/"} />
        </StyledIconMobileContainer> */}
        <Flex
          order={[1, null, 2]}
          flexDirection={["column", null, "row"]}
          justifyContent="space-between"
          alignItems="flex-start"
          mb={["0px", null, "18px"]}
        >
          {items?.map((item) => (
            <StyledList key={item.label}>
              <StyledListItem></StyledListItem>
              {item.items?.map(({ label, href, isHighlighted = false, blank = false }) => (
                <StyledListItem key={label}>
                  {href ? ( blank? (
                    <ALink
                      data-theme="dark"
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      color={isHighlighted ? vars.colors.text : "primary"}
                      bold={false}
                    >
                      {label}
                    </ALink>
                  ) : (
                    <Link href={href} passHref>
                      <Text color={isHighlighted ? vars.colors.text : "primary"}>{label}</Text>
                    </Link>
                  )) : (
                    <StyledText>{label}</StyledText>
                  )}
                </StyledListItem>
              ))}
            </StyledList>
          ))}
          {/* <Box display={["none", null, "block"]}>
            <Logo href={"/"} />
          </Box> */}
        </Flex>
        <StyledToolsContainer
          data-theme="dark"
          order={[1, null, 3]}
          flexDirection={["column", null, "row"]}
          justifyContent="space-between"
        >
          {/* <Flex order={[2, null, 1]} justifyContent="center" alignItems="center">
            <SkeletonV2 variant="round" width="56px" height="32px" isDataReady={isMounted}>
              <ThemeSwitcher isDark={isDark} toggleTheme={toggleTheme} />
            </SkeletonV2>
            <LangSelector
              currentLang={currentLang}
              langs={langs}
              setLang={setLang}
              color="textSubtle"
              dropdownPosition="top-right"
            />
          </Flex> */}
          {/* <StyledSocialLinks order={[2]} pb={["42px", null, "32px"]} mb={["0", null, "32px"]} /> */}
          <Flex order={[1, null, 2]} mb={["24px", null, "0"]} justifyContent="center" alignItems="center">
            <Logo href={"/"} />
            <Box display={["none", null, "block"]}>
              <Box ml="20px">
                <CakePrice cakePriceUsd={cakePriceUsd} color="textSubtle" />
              </Box>
            </Box>
          </Flex>
          <Flex order={[1, null, 2]} justifyContent="center" alignItems="center">
            <StyledSocialLinks order={[2]} />
          </Flex>
        </StyledToolsContainer>
      </Flex>
    </StyledFooter>
  );
};

export default MenuItem;
