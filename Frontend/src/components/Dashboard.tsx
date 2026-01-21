import React, { useState, useEffect } from 'react';
import {
    LuLayout,
    LuUsers,
    LuClock,
    LuSettings,
    LuSearch,
    LuChevronDown,
    LuPlus,
    LuLayoutDashboard,
    LuMenu,
    LuX,
    LuLogOut,
    LuCopy,
    LuShare2,
    LuLogIn
} from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import useAuth from '../hooks/useAuth';
import { auth } from '../config/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import axios from 'axios';
import logo from '../assets/logo.png';

import {
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    Button,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    useDisclosure,
    Text,
    VStack,
    Box,
    Spinner,
    Center,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useColorModeValue
} from '@chakra-ui/react';

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => {
    const activeBg = useColorModeValue('blue.50', 'blue.900');
    const activeColor = useColorModeValue('blue.600', 'blue.300');
    const inactiveColor = useColorModeValue('gray.600', 'gray.400');

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                ? `${activeBg} ${activeColor}`
                : `${inactiveColor} hover:bg-gray-50 hover:text-gray-900`
                }`}
            style={{
                backgroundColor: active ? activeBg : undefined,
                color: active ? activeColor : undefined
            }}
        >
            <Icon size={20} />
            {label}
        </button>
    );
};

const BoardCard = ({ title, lastEdited, owner, image, roomId, onNewBoardClick, isNew = false }: {
    title: string,
    lastEdited?: string,
    owner?: string,
    image?: string,
    roomId?: string,
    onNewBoardClick?: () => void,
    isNew?: boolean
}) => {
    const navigate = useNavigate();
    const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
    const cardBg = useColorModeValue('white', 'whiteAlpha.50');
    const textColor = useColorModeValue('gray.900', 'white');
    const subTextColor = useColorModeValue('gray.500', 'gray.400');

    if (isNew) {
        return (
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNewBoardClick}
                className="group relative flex flex-col gap-3"
            >
                <div className={`aspect-[4/3] w-full border-2 border-dashed ${useColorModeValue('border-gray-200', 'border-whiteAlpha.300')} rounded-xl flex items-center justify-center text-gray-400 group-hover:border-blue-400 group-hover:text-blue-500 transition-colors`}>
                    <LuPlus size={40} />
                </div>
                <div className="text-left px-1">
                    <h3 className={`font-semibold ${textColor} text-sm md:text-base`}>New Board</h3>
                </div>
            </motion.button>
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/${roomId}`)}
            className="group cursor-pointer flex flex-col gap-3"
        >
            <div className={`aspect-[4/3] w-full rounded-xl overflow-hidden border ${borderColor} shadow-sm relative ${cardBg}`}>
                {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full ${useColorModeValue('bg-gray-50', 'whiteAlpha.50')} flex items-center justify-center text-gray-300`}>
                        <LuLayoutDashboard size={40} />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="px-1">
                <h3 className={`font-semibold ${textColor} mb-0.5 text-sm md:text-base truncate`}>{title}</h3>
                <p className={`text-[10px] md:text-xs ${subTextColor}`}>Last edited: {lastEdited}</p>
                <p className={`text-[10px] md:text-xs ${useColorModeValue('text-gray-400', 'gray.500')} font-medium`}>Owner: {owner}</p>
            </div>
        </motion.div>
    );
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, getIdToken } = useAuth();
    const { isOpen, onOpen: onOpenModal, onClose } = useDisclosure();

    const [tabIndex, setTabIndex] = useState(0);
    const [boardName, setBoardName] = useState('');
    const [joinLink, setJoinLink] = useState('');
    const [generatedRoomId, setGeneratedRoomId] = useState('');
    const [shareLink, setShareLink] = useState('');
    const [boards, setBoards] = useState<any[]>([]);
    const [isLoadingBoards, setIsLoadingBoards] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const fetchBoards = async () => {
        if (!user) return;
        try {
            const token = await getIdToken();
            const response = await axios.get(`${ENDPOINT}/drawings/my-boards`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBoards(response.data);
        } catch (error) {
            console.error("Error fetching boards:", error);
            toast({
                title: "Error",
                description: "Failed to load your boards.",
                status: "error",
                duration: 3000,
            });
        } finally {
            setIsLoadingBoards(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBoards();
        }
    }, [user]);

    const onOpen = (index: number = 0) => {
        setTabIndex(index);
        onOpenModal();
    };

    useEffect(() => {
        if (isOpen) {
            const id = uuidv4();
            setGeneratedRoomId(id);
            if (tabIndex === 0) setBoardName('');
            if (tabIndex === 1) setJoinLink('');
        }
    }, [isOpen, tabIndex]);

    useEffect(() => {
        if (generatedRoomId) {
            setShareLink(`${window.location.origin}/${generatedRoomId}`);
        }
    }, [generatedRoomId]);

    const handleLogout = async () => {
        try {
            await firebaseSignOut(auth);
            localStorage.removeItem('boardify_token');
            localStorage.removeItem('boardify_user');
            toast({
                title: "Logged out",
                description: "Redirecting to home page...",
                status: "info",
                duration: 2000,
                isClosable: true,
            });
            navigate("/");
        } catch (error: any) {
            toast({
                title: "Logout Error",
                description: error.message,
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        }
    };

    const handleCreateBoard = async () => {
        if (!boardName.trim()) {
            toast({
                title: "Name Required",
                description: "Please enter a board name.",
                status: "warning",
                duration: 2000,
            });
            return;
        }

        setIsCreating(true);
        try {
            const token = await getIdToken();
            await axios.post(`${ENDPOINT}/drawings/save`, {
                roomId: generatedRoomId,
                name: boardName.trim(),
                elements: []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({
                title: "Board Created",
                status: "success",
                duration: 2000,
            });

            navigate(`/${generatedRoomId}`);
            onClose();
        } catch (error) {
            toast({
                title: "Creation Failed",
                description: "Something went wrong.",
                status: "error",
                duration: 3000,
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinBoard = () => {
        if (!joinLink.trim()) {
            toast({
                title: "Link Required",
                status: "warning",
                duration: 2000,
            });
            return;
        }

        try {
            // Extract UUID from link if it's a full URL
            let roomId = joinLink.trim();
            if (roomId.includes('/')) {
                roomId = roomId.split('/').pop() || '';
            }

            if (roomId) {
                navigate(`/${roomId}`);
                onClose();
            } else {
                throw new Error("Invalid Format");
            }
        } catch (error) {
            toast({
                title: "Invalid Room Link",
                description: "Please check the URL/ID and try again.",
                status: "error",
                duration: 3000,
            });
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareLink);
        toast({
            title: "Link Copied",
            description: "Share it with your teammates!",
            status: "success",
            duration: 2000,
        });
    };

    const SidebarContent = () => {
        const logoColor = useColorModeValue('gray.900', 'white');
        const borderColor = useColorModeValue('gray.50', 'whiteAlpha.100');
        const profileBg = useColorModeValue('gray.50/50', 'whiteAlpha.50');

        return (
            <>
                <div
                    className="flex items-center justify-between px-2 mb-8 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/10">
                            <img src={logo} alt="Boardify Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className={`font-bold text-xl ${logoColor}`}>Boardify</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}
                        className={`md:hidden p-2 ${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-100 rounded-lg`}
                    >
                        <LuX size={20} />
                    </button>
                </div>

                <nav className="flex-1 flex flex-col gap-1">
                    <SidebarItem icon={LuLayout} label="My Boards" active />
                    <SidebarItem icon={LuUsers} label="Shared with Me" />
                    <SidebarItem icon={LuClock} label="Recent" />
                </nav>

                <div className={`mt-auto pt-4 border-t ${borderColor} flex flex-col gap-1`}>
                    <SidebarItem icon={LuSettings} label="Settings" />
                    <SidebarItem
                        icon={LuLogOut}
                        label="Logout"
                        onClick={handleLogout}
                    />

                    {user && (
                        <div className={`flex items-center gap-3 px-4 py-4 mt-2 ${profileBg} rounded-xl border ${borderColor}`}>
                            <img
                                src={user.photoURL || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop"}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border border-gray-100"
                            />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${logoColor} truncate`}>{user.displayName || "User"}</p>
                                <p className={`text-[10px] ${useColorModeValue('text-gray-500', 'gray.400')} truncate`}>{user.email}</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className={`flex min-h-screen ${useColorModeValue('bg-white', '#0f172a')} font-sans relative transition-colors duration-300`}>
            {/* New Board Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent borderRadius="2xl" p={2}>
                    <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} colorScheme="blue" variant="soft-rounded" px={4} pt={4}>
                        <TabList bg="gray.50" borderRadius="xl" p={1}>
                            <Tab flex={1} borderRadius="lg" fontSize="sm" fontWeight="bold">
                                <LuPlus style={{ marginRight: '8px' }} /> Create
                            </Tab>
                            <Tab flex={1} borderRadius="lg" fontSize="sm" fontWeight="bold">
                                <LuLogIn style={{ marginRight: '8px' }} /> Join
                            </Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel px={0} py={6}>
                                <VStack spacing={6}>
                                    <FormControl>
                                        <FormLabel color="gray.600">Board Name / Session Name</FormLabel>
                                        <Input
                                            placeholder="e.g. Brainstorming Session"
                                            size="lg"
                                            borderRadius="xl"
                                            value={boardName}
                                            onChange={(e) => setBoardName(e.target.value)}
                                            autoFocus
                                        />
                                    </FormControl>

                                    <Box w="full">
                                        <FormLabel color={useColorModeValue('gray.600', 'gray.400')}>Shareable Link</FormLabel>
                                        <InputGroup size="lg">
                                            <Input
                                                pr="4.5rem"
                                                value={shareLink}
                                                readOnly
                                                bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                                                borderRadius="xl"
                                                fontSize="sm"
                                                border="none"
                                            />
                                            <InputRightElement width="4.5rem">
                                                <Button h="1.75rem" size="sm" onClick={copyLink} variant="ghost" colorScheme="blue">
                                                    <LuCopy />
                                                </Button>
                                            </InputRightElement>
                                        </InputGroup>
                                        <Text fontSize="xs" color="gray.500" mt={2} display="flex" alignItems="center" gap={1}>
                                            <LuShare2 size={12} /> Anyone with this link can view and edit.
                                        </Text>
                                    </Box>
                                    <Button
                                        colorScheme="blue"
                                        size="lg"
                                        borderRadius="xl"
                                        w="full"
                                        onClick={handleCreateBoard}
                                        isLoading={isCreating}
                                        leftIcon={<LuPlus />}
                                    >
                                        Create Board
                                    </Button>
                                </VStack>
                            </TabPanel>
                            <TabPanel px={0} py={6}>
                                <VStack spacing={6}>
                                    <FormControl>
                                        <FormLabel color="gray.600">Board Link or Room ID</FormLabel>
                                        <Input
                                            placeholder="Paste link or session ID here..."
                                            size="lg"
                                            borderRadius="xl"
                                            value={joinLink}
                                            onChange={(e) => setJoinLink(e.target.value)}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <Text fontSize="xs" color="gray.500" w="full">
                                        Ask your teammate for the invite link to join their session.
                                    </Text>
                                    <Button
                                        colorScheme="blue"
                                        size="lg"
                                        borderRadius="xl"
                                        w="full"
                                        onClick={handleJoinBoard}
                                        leftIcon={<LuLogIn />}
                                    >
                                        Join Session
                                    </Button>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalContent>
            </Modal>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[40] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 ${useColorModeValue('bg-white', '#0f172a')} border-r ${useColorModeValue('border-gray-100', 'whiteAlpha.100')} p-4 z-[50] w-64 transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static
            `}>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${useColorModeValue('bg-gray-50/30', 'whiteAlpha.50')} min-w-0 overflow-x-hidden transition-colors`}>
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {/* Header */}
                    <header className="flex flex-col gap-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className={`md:hidden p-2 -ml-2 ${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-100 rounded-lg`}
                                >
                                    <LuMenu size={24} />
                                </button>
                                <div>
                                    <h1 className={`text-xl md:text-2xl font-bold ${useColorModeValue('text-gray-900', 'white')}`}>
                                        Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
                                    </h1>
                                    <p className={`text-sm ${useColorModeValue('text-gray-500', 'gray.400')}`}>Here's what's happening with your boards.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onOpen(1)}
                                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 ${useColorModeValue('text-gray-700', 'whiteAlpha.800')} ${useColorModeValue('bg-white', 'whiteAlpha.100')} border ${useColorModeValue('border-gray-200', 'whiteAlpha.200')} rounded-lg text-sm font-bold hover:bg-opacity-80 transition-colors shadow-sm`}
                                >
                                    <LuLogIn size={18} />
                                    <span className="hidden sm:inline">Join</span>
                                </button>
                                <button
                                    onClick={() => onOpen(0)}
                                    className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                                >
                                    <LuPlus size={18} />
                                    <span className="hidden sm:inline">New Board</span>
                                    <span className="sm:hidden text-xs">New</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1 group">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search boards..."
                                    className={`w-full pl-10 pr-4 py-2 ${useColorModeValue('bg-white', 'whiteAlpha.50')} border ${useColorModeValue('border-gray-200', 'whiteAlpha.200')} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm ${useColorModeValue('text-gray-900', 'white')}`}
                                />
                            </div>

                            <button className={`flex items-center justify-between gap-2 px-4 py-2 border ${useColorModeValue('border-gray-200', 'whiteAlpha.200')} rounded-lg text-sm font-medium ${useColorModeValue('text-gray-700', 'whiteAlpha.700')} ${useColorModeValue('bg-white', 'whiteAlpha.50')} hover:bg-opacity-80 transition-colors shadow-sm whitespace-nowrap`}>
                                <span className="text-xs md:text-sm">Sort: Last Edited</span>
                                <LuChevronDown size={14} className="text-gray-400" />
                            </button>
                        </div>
                    </header>

                    {/* Boards Grid */}
                    {isLoadingBoards ? (
                        <Center py={20}>
                            <VStack spacing={4}>
                                <Spinner size="xl" color="blue.500" thickness="4px" />
                                <Text color="gray.500">Loading your boards...</Text>
                            </VStack>
                        </Center>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
                            <BoardCard title="New Board" isNew onNewBoardClick={onOpen} />
                            {boards.length > 0 ? (
                                boards.map((board) => (
                                    <BoardCard
                                        key={board.roomId}
                                        title={board.name}
                                        roomId={board.roomId}
                                        image={board.thumbnail}
                                        lastEdited={new Date(board.updatedAt).toLocaleDateString()}
                                        owner="You"
                                    />
                                ))
                            ) : (
                                <Box gridColumn="span 4" py={10} textAlign="center">
                                    <Text color="gray.400">You haven't created any boards yet.</Text>
                                </Box>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
