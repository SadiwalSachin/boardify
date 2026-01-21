import Cards from "./Cards";
import Navbar from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";
import CreateRoom from "./CreateRoom";
import JoinRoom from "./JoinRoom";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import {
  useToast,
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  Flex,
  useColorModeValue,
  Icon,
  Badge
} from "@chakra-ui/react";
import { LuSparkles, LuChevronRight } from "react-icons/lu";

// Use the generated image path (Antigravity will handle the path transformation)
import futuristicHero from "../assets/hero.png"; // Keeping import name for simplicity, will update if needed
import logo from "../assets/logo.png";


interface HomeProps {
  socket: any;
}

const Home: React.FC<HomeProps> = ({ socket }) => {
  const [showAction, setShowAction] = useState<"create" | "join" | null>(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const toast = useToast();

  const bg = useColorModeValue("white", "#0f172a");
  const textColor = useColorModeValue("gray.900", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const secondaryBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const handleAction = (path: string) => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please login to create or access boards.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  return (
    <Box minH="100vh" bg={bg} overflowX="hidden" className="font-sans">
      <Navbar />

      {/* Decorative Background Elements */}
      <Box position="absolute" top="-10%" right="-10%" w="600px" h="600px" bg="blue.500" filter="blur(150px)" opacity={useColorModeValue(0.05, 0.1)} borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="10%" left="-5%" w="400px" h="400px" bg="purple.500" filter="blur(120px)" opacity={useColorModeValue(0.05, 0.1)} borderRadius="full" pointerEvents="none" />

      {/* Hero Section */}
      <Container maxW="container.xl" pt={{ base: 12, md: 24 }} pb={20}>
        <Stack direction={{ base: "column", lg: "row" }} spacing={12} align="center">

          {/* Content Left */}
          <Flex flex={1} direction="column" zIndex={1}>
            <AnimatePresence mode="wait">
              {!showAction ? (
                <motion.div
                  key="hero-text"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <Badge
                    px={3} py={1} mb={6} borderRadius="full" colorScheme="blue" variant="subtle"
                    display="inline-flex" alignItems="center" gap={2}
                  >
                    <Icon as={LuSparkles} />
                    <Text fontSize="xs" fontWeight="bold" letterSpacing="wider">NEXT-GEN COLLABORATION</Text>
                  </Badge>

                  <Heading
                    fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
                    fontWeight="800"
                    lineHeight="1.1"
                    mb={6}
                    color={textColor}
                    letterSpacing="tight"
                  >
                    Visualize Ideas in <br />
                    <Text as="span" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                      Real-Time.
                    </Text>
                  </Heading>

                  <Text fontSize={{ base: "lg", md: "xl" }} color={subTextColor} mb={10} maxW="500px">
                    The ultra-fast collaborative whiteboard for modern teams to brainstorm, design, and build together.
                  </Text>

                  <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
                    <Button
                      size="lg"
                      colorScheme="blue"
                      h="60px"
                      px={10}
                      borderRadius="2xl"
                      fontSize="md"
                      fontWeight="bold"
                      boxShadow="0 20px 40px -10px rgba(66, 153, 225, 0.4)"
                      _hover={{ transform: 'translateY(-2px)', boxShadow: '0 25px 50px -12px rgba(66, 153, 225, 0.5)' }}
                      rightIcon={<LuChevronRight />}
                      onClick={() => handleAction("/dashboard")}
                    >
                      Start Drawing
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      h="60px"
                      px={10}
                      borderRadius="2xl"
                      fontSize="md"
                      fontWeight="bold"
                      color={textColor}
                      _hover={{ bg: secondaryBg }}
                      onClick={() => handleAction("/dashboard")}
                    >
                      Try as Guest
                    </Button>
                  </Stack>
                </motion.div>
              ) : (
                <motion.div
                  key="action-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`w-full max-w-md p-10 backdrop-blur-xl ${useColorModeValue('bg-white/80', 'gray.800/80')} border-2 ${useColorModeValue('border-white', 'whiteAlpha.100')} rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden`}
                >
                  <Button
                    variant="link"
                    color="blue.500"
                    mb={6}
                    onClick={() => setShowAction(null)}
                  >
                    ← Back to Home
                  </Button>
                  {showAction === "create" ? (
                    <CreateRoom socket={socket} />
                  ) : (
                    <JoinRoom socket={socket} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Flex>

          {/* Visual Right */}
          <Flex flex={1.2} w="full" position="relative">
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ width: '100%' }}
            >
              <Box
                position="relative"
                borderRadius="3xl"
                overflow="hidden"
                boxShadow="2xl"
                borderWidth="1px"
                borderColor={useColorModeValue("white", "whiteAlpha.200")}
              >
                <Box position="absolute" inset={0} bgGradient="linear(to-tr, blue.500, transparent)" opacity={0.2} pointerEvents="none" />
                <img
                  src={futuristicHero}
                  alt="Futuristic Board Preview"
                  className="w-full h-auto"
                />
              </Box>

              {/* Floating Elements for futuristic feel */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: 'absolute', top: '-20px', right: '20px', zIndex: 2 }}
              >
                <Box bg={secondaryBg} backdropFilter="blur(10px)" px={4} py={3} borderRadius="2xl" boxShadow="xl" border="1px solid" borderColor={useColorModeValue("whiteAlpha.800", "whiteAlpha.100")}>
                  <Flex align="center" gap={3}>
                    <Box w={2} h={2} bg="green.400" borderRadius="full" />
                    <Text fontSize="xs" fontWeight="bold" color={textColor}>5 Users Collaborating</Text>
                  </Flex>
                </Box>
              </motion.div>
            </motion.div>
          </Flex>
        </Stack>
      </Container>

      {/* Features Showcase */}
      <Box bg={secondaryBg} py={24}>
        <Container maxW="container.xl">
          <Flex direction="column" align="center" textAlign="center" mb={16}>
            <Badge
              px={3} py={1} mb={4} borderRadius="full" colorScheme="purple" variant="subtle"
            >
              FEATURES
            </Badge>
            <Heading fontSize={{ base: "3xl", md: "4xl" }} fontWeight="800" color={textColor} mb={4}>
              Everything You Need to Create.
            </Heading>
            <Text color={subTextColor} maxW="600px">
              Built with the latest technologies to ensure your ideas move as fast as your mind.
              Real-time updates, secure cloud storage, and intuitive tools.
            </Text>
          </Flex>

          <Cards />
        </Container>
      </Box>

      {/* Footer */}
      <Box as="footer" py={20} borderTop="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
        <Container maxW="container.xl">
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={8}>
            <Flex align="center" gap={3}>
              <Box w="8" h="8" borderRadius="lg" overflow="hidden" boxShadow="lg">
                <img src={logo} alt="Boardify Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
              <Text fontWeight="extrabold" fontSize="xl" letterSpacing="tighter" color={textColor}>Boardify</Text>
            </Flex>

            <Text fontSize="sm" color="gray.500">
              © 2024 Boardify. High-performance creative tools.
            </Text>

            <Stack direction="row" spacing={6}>
              <Icon as={FaGithub} boxSize={6} color="gray.400" cursor="pointer" _hover={{ color: "blue.500" }} transition="colors 0.2s" />
            </Stack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
