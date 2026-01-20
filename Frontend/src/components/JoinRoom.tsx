import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { roomData } from "./CreateRoom";
import { v4 as uuidv4 } from "uuid";
import { LuLogIn } from "react-icons/lu";
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Icon,
  useColorModeValue,
  Flex
} from "@chakra-ui/react";

interface JoinRoomProps {
  socket: any;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ socket }) => {
  const [roomId, setRoomId] = useState<string>("");
  const navigate = useNavigate();

  const cardBg = useColorModeValue("white", "gray.800");

  const handleRoomJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const roomData: roomData = {
      roomName: "",
      roomId: roomId,
      userId: uuidv4(),
      host: false,
    };

    socket.emit("joinRoom", roomData);
    navigate(`/${roomId}`);
  };

  return (
    <form onSubmit={handleRoomJoin} style={{ width: '100%' }}>
      <VStack spacing={6} w="full">
        <Box textAlign="center" mb={2}>
          <Flex
            w={20}
            h={20}
            mx="auto"
            mb={4}
            bgGradient="linear(to-br, blue.400, indigo.600)"
            borderRadius="3xl"
            align="center"
            justify="center"
            boxShadow="0 10px 20px -5px rgba(66, 153, 225, 0.4)"
            color="white"
          >
            <Icon as={LuLogIn} fontSize="4xl" />
          </Flex>
          <Heading size="lg" fontWeight="800" letterSpacing="tight">Join Room</Heading>
          <Text color="gray.500" fontSize="sm">Connect with your team instantly</Text>
        </Box>

        <Input
          placeholder="Enter room ID"
          size="lg"
          h="60px"
          borderRadius="2xl"
          bg={useColorModeValue("gray.50", "whiteAlpha.100")}
          border="2px solid"
          borderColor="transparent"
          _focus={{ borderColor: "blue.400", bg: cardBg, boxShadow: "0 0 0 4px rgba(66, 153, 225, 0.15)" }}
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />

        <Button
          type="submit"
          w="full"
          h="60px"
          size="lg"
          colorScheme="blue"
          borderRadius="2xl"
          fontWeight="bold"
          boxShadow="0 15px 30px -10px rgba(66, 153, 225, 0.4)"
          _hover={{ transform: 'translateY(-2px)' }}
          _active={{ transform: 'scale(0.98)' }}
        >
          JOIN SPACE
        </Button>
      </VStack>
    </form>
  );
};

export default JoinRoom;
