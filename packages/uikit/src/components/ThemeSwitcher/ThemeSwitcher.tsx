import { memo } from "react";
import styled from 'styled-components'
import { SunIcon, MoonIcon } from "../Svg";
import { Toggle } from "../Toggle";
import { Flex } from "../Box";

export interface Props {
  isDark: boolean;
  toggleTheme: (isDark: boolean) => void;
}

const StyledFlex = styled(Flex)`
  cursor: pointer;
`

const ThemeSwitcher: React.FC<React.PropsWithChildren<Props>> = ({ isDark, toggleTheme }) => (
  // <Toggle
  //   checked={isDark}
  //   defaultColor="textDisabled"
  //   checkedColor="textDisabled"
  //   onChange={() => toggleTheme(!isDark)}
  //   scale="md"
  //   startIcon={(isActive = false) => <SunIcon color={isActive ? "warning" : "backgroundAlt"} />}
  //   endIcon={(isActive = false) => <MoonIcon color={isActive ? "secondary" : "backgroundAlt"} />}
  // />
  <StyledFlex alignItems="center" m="4px" justifyContent="center" justifyItems="center" >
    {isDark? <SunIcon color="spec" width="24px" onClick={() => toggleTheme(isDark)} /> : <MoonIcon color="spec" width="24px" onClick={() => toggleTheme(!isDark)} />}
  </StyledFlex>
);

export default memo(ThemeSwitcher, (prev, next) => prev.isDark === next.isDark);
