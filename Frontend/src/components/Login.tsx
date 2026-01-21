import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  Divider,
  useToast,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import logo from '../assets/logo.png';


const Login: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('[AUTH] Initiating Google Sign-In');
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      console.log(`[AUTH] Firebase Token acquired for ${result.user.email}`);

      const res = await axios.post(`${ENDPOINT}/users/sync`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('[AUTH] Google Sign-In successful, user synced with backend');

      localStorage.setItem('boardify_token', res.data.token);
      localStorage.setItem('boardify_user', JSON.stringify(res.data.user));

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${result.user.displayName || 'User'}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast({
        title: 'Login Failed',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Email and Password required",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    console.log(`[AUTH] Initiating Login for ${email}`);
    setIsLoading(true);
    try {
      const res = await axios.post(`${ENDPOINT}/users/login`, {
        email,
        password
      });
      console.log(`[AUTH] Login successful for ${email}`);

      localStorage.setItem('boardify_token', res.data.token);
      localStorage.setItem('boardify_user', JSON.stringify({
        displayName: res.data.name,
        email: res.data.email
      }));

      toast({
        title: 'Login Successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error(`[AUTH] Login failed for ${email}:`, error.response?.data?.error || error.message);
      toast({
        title: 'Login Failed',
        description: error.response?.data?.error || "Invalid credentials",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.900", "white");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const cardBorder = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "#0f172a")} py={12} position="relative" overflow="hidden" className="font-sans">
      {/* Decorative Background Elements */}
      <Box position="absolute" top="-10%" right="-10%" w="400px" h="400px" bg="blue.500" filter="blur(100px)" opacity={0.05} borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="-10%" left="-5%" w="300px" h="300px" bg="purple.500" filter="blur(80px)" opacity={0.05} borderRadius="full" pointerEvents="none" />

      <Container centerContent maxW="md" position="relative" zIndex={1}>
        <VStack spacing={8} w="full">
          <Flex align="center" gap={3} cursor="pointer" onClick={() => navigate("/")} _hover={{ transform: 'scale(1.02)' }} transition="all 0.2s">
            <Box w="12" h="12" borderRadius="2xl" overflow="hidden" boxShadow="xl">
              <img src={logo} alt="Boardify Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Heading as="h1" size="xl" fontWeight="800" letterSpacing="tighter" color={textColor}>
              Boardify
            </Heading>
          </Flex>

          <Box w="full" p={10} borderWidth={1} borderColor={cardBorder} borderRadius="3xl" boxShadow="2xl" bg={bg}>
            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <VStack spacing={8}>
                <VStack spacing={1} textAlign="center">
                  <Heading size="lg" fontWeight="800" color={textColor}>Welcome Back</Heading>
                  <Text fontSize="sm" color={secondaryTextColor}>Enter your details to access your boards</Text>
                </VStack>

                <VStack spacing={4} w="full">
                  <FormControl id="email">
                    <FormLabel fontSize="sm" fontWeight="bold" color={textColor}>Email</FormLabel>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      borderRadius="xl"
                      h="56px"
                      bg={useColorModeValue("gray.50", "whiteAlpha.50")}
                      border="none"
                      focusBorderColor="blue.500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>
                  <FormControl id="password">
                    <FormLabel fontSize="sm" fontWeight="bold" color={textColor}>Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      borderRadius="xl"
                      h="56px"
                      bg={useColorModeValue("gray.50", "whiteAlpha.50")}
                      border="none"
                      focusBorderColor="blue.500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </FormControl>
                  <Button
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    h="60px"
                    borderRadius="2xl"
                    type="submit"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    fontSize="md"
                    fontWeight="bold"
                    boxShadow="0 15px 30px -10px rgba(66, 153, 225, 0.4)"
                    _hover={{ transform: 'translateY(-2px)' }}
                    _active={{ transform: 'scale(0.98)' }}
                  >
                    Login
                  </Button>
                </VStack>

                <Box w="full" position="relative" py={2}>
                  <Divider borderColor={cardBorder} />
                  <Text
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    bg={bg}
                    px={4}
                    fontSize="xs"
                    fontWeight="bold"
                    color={secondaryTextColor}
                    letterSpacing="widest"
                  >
                    OR CONTINUE WITH
                  </Text>
                </Box>

                <Button
                  variant="outline"
                  size="lg"
                  w="full"
                  h="60px"
                  borderRadius="2xl"
                  leftIcon={<FcGoogle size={22} />}
                  onClick={handleGoogleLogin}
                  isLoading={isLoading}
                  borderColor={cardBorder}
                  fontSize="md"
                  fontWeight="bold"
                  _hover={{ bg: useColorModeValue('gray.50', 'whiteAlpha.100'), transform: 'translateY(-2px)' }}
                  _active={{ transform: 'scale(0.98)' }}
                >
                  Google Account
                </Button>
              </VStack>
            </form>
          </Box>
          <Text color={secondaryTextColor} fontSize="sm">
            New to Boardify?{' '}
            <Link as={RouterLink} to="/signup" color="blue.500" fontWeight="extrabold" _hover={{ textDecoration: 'none', color: 'blue.600' }}>
              Create an account
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;