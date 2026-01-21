import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  IconButton,
  useColorMode,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
import { auth } from "../config/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import useAuth from "../hooks/useAuth";
import { LuMoon, LuSun, LuLayout, LuLogOut } from "react-icons/lu";
import logo from "../assets/logo.png";


const Navbar = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isLoggedIn } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  const bg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(15, 23, 42, 0.8)");
  const textColor = useColorModeValue("gray.900", "white");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('boardify_token');
      localStorage.removeItem('boardify_user');
      toast({
        title: "Logged out",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Logout Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      px={{ base: 6, md: 10, lg: 24 }}
      py={4}
      bg={bg}
      backdropFilter="blur(20px)"
      position="sticky"
      top={0}
      zIndex={1000}
      borderBottom="1px solid"
      borderColor={borderColor}
      transition="all 0.3s"
    >
      {/* Logo */}
      <Flex
        align="center"
        gap={3}
        cursor="pointer"
        onClick={() => navigate("/")}
        _hover={{ opacity: 0.8 }}
      >
        <Box
          w="10" h="10"
          borderRadius="xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          boxShadow="0 8px 20px -4px rgba(66, 153, 225, 0.3)"
        >
          <img src={logo} alt="Boardify Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
        <Heading size="md" color={textColor} fontWeight="800" letterSpacing="tighter">Boardify</Heading>
      </Flex>

      {/* Actions */}
      <Flex align="center" gap={4}>
        <IconButton
          aria-label="Toggle theme"
          icon={colorMode === "light" ? <LuMoon size={20} /> : <LuSun size={20} />}
          onClick={toggleColorMode}
          variant="ghost"
          borderRadius="xl"
          color={colorMode === "light" ? "gray.600" : "yellow.400"}
          _hover={{ bg: useColorModeValue("gray.100", "whiteAlpha.200") }}
        />

        {isLoggedIn && user ? (
          <Menu>
            <MenuButton>
              <Flex align="center" gap={3} p={1} pl={3} borderRadius="full" bg={useColorModeValue("gray.50", "whiteAlpha.100")} border="1px solid" borderColor={borderColor} transition="all 0.2s" _hover={{ bg: useColorModeValue("gray.100", "whiteAlpha.200") }}>
                <Text fontWeight="bold" fontSize="sm" color={textColor} display={{ base: "none", md: "block" }}>
                  {user.displayName?.split(' ')[0]}
                </Text>
                <Avatar size="sm" name={user.displayName || ""} src={user.photoURL || ""} border="2px solid" borderColor="blue.500" />
              </Flex>
            </MenuButton>
            <MenuList border="1px solid" borderColor={borderColor} boxShadow="2xl" bg={useColorModeValue("white", "gray.800")} p={2} borderRadius="2xl">
              <MenuItem
                borderRadius="xl"
                onClick={() => navigate("/dashboard")}
                icon={<LuLayout size={18} />}
                fontWeight="bold"
                fontSize="sm"
                _hover={{ bg: useColorModeValue("blue.50", "whiteAlpha.100"), color: "blue.500" }}
              >
                Dashboard
              </MenuItem>
              <MenuItem
                borderRadius="xl"
                color="red.500"
                onClick={handleLogout}
                icon={<LuLogOut size={18} />}
                fontWeight="bold"
                fontSize="sm"
                _hover={{ bg: "red.50" }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button
            onClick={() => navigate("/login")}
            variant="solid"
            colorScheme="blue"
            fontWeight="bold"
            borderRadius="xl"
            h="44px"
            px={8}
            boxShadow="0 8px 20px -6px rgba(66, 153, 225, 0.4)"
            _hover={{ transform: 'translateY(-1px)', boxShadow: '0 10px 25px -5px rgba(66, 153, 225, 0.5)' }}
          >
            Log In
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default Navbar;
