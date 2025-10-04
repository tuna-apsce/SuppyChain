// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AgriSupplyChain {
    // Enums
    enum UserRole { FARMER, PROCESSOR, TRANSPORTER, WAREHOUSE, RETAILER, CONSUMER }
    enum EventType { 
        HARVEST, 
        PROCESSING, 
        TRANSPORT_START, 
        TRANSPORT_END, 
        WAREHOUSE_IN, 
        WAREHOUSE_OUT, 
        RETAIL_RECEIVE, 
        SALE 
    }

    // Data Structures
    struct Product {
        uint256 productId;
        string batchId;
        address farmer;
        string productName;
        string category;
        string origin;
        uint256 harvestDate;
        uint256 expiryDate;
        uint256 quantity;
        string unit;
        string ipfsHash;
        bool isActive;
        address currentOwner;
        uint256 createdAt;
    }

    struct SupplyChainEvent {
        uint256 eventId;
        string batchId;
        EventType eventType;
        address actor;
        string location;
        uint256 timestamp;
        string ipfsHash;
        string notes;
    }

    struct User {
        address userAddress;
        UserRole role;
        string companyName;
        bool isVerified;
        bool isActive;
        uint256 registrationDate;
    }

    // State Variables
    mapping(address => User) public users;
    mapping(string => Product) public products;
    mapping(string => SupplyChainEvent[]) public productEvents;
    mapping(uint256 => Product) public productsById;
    
    uint256 public nextProductId = 1;
    uint256 public nextEventId = 1;
    address public admin;
    
    // Arrays for iteration
    address[] public registeredUsers;
    string[] public allBatchIds;

    // Events
    event UserRegistered(address indexed user, UserRole role, string companyName);
    event UserVerified(address indexed user);
    event UserActivated(address indexed user);
    event UserDeactivated(address indexed user);
    event ProductCreated(uint256 indexed productId, string indexed batchId, address indexed farmer);
    event EventAdded(uint256 indexed eventId, string indexed batchId, EventType eventType, address indexed actor);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyVerifiedUser() {
        require(users[msg.sender].isVerified && users[msg.sender].isActive, "User not verified or inactive");
        _;
    }

    modifier onlyFarmer() {
        require(users[msg.sender].role == UserRole.FARMER && users[msg.sender].isVerified, "Only verified farmers can perform this action");
        _;
    }

    modifier productExists(string memory batchId) {
        require(products[batchId].createdAt != 0, "Product does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // User Management Functions
    function registerUser(UserRole role, string memory companyName) external {
        require(users[msg.sender].userAddress == address(0), "User already registered");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            role: role,
            companyName: companyName,
            isVerified: false,
            isActive: true,
            registrationDate: block.timestamp
        });
        
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, role, companyName);
    }

    function verifyUser(address userAddress) external onlyAdmin {
        require(users[userAddress].userAddress != address(0), "User not registered");
        users[userAddress].isVerified = true;
        emit UserVerified(userAddress);
    }

    function deactivateUser(address userAddress) external onlyAdmin {
        require(users[userAddress].userAddress != address(0), "User not registered");
        users[userAddress].isActive = false;
        emit UserDeactivated(userAddress);
    }

    function activateUser(address userAddress) external onlyAdmin {
        require(users[userAddress].userAddress != address(0), "User not registered");
        users[userAddress].isActive = true;
        emit UserActivated(userAddress);
    }

    // Product Management Functions
    function createProduct(
        string memory batchId,
        string memory productName,
        string memory category,
        string memory origin,
        uint256 harvestDate,
        uint256 expiryDate,
        uint256 quantity,
        string memory unit,
        string memory ipfsHash
    ) external onlyFarmer {
        require(products[batchId].createdAt == 0, "Batch ID already exists");
        
        Product memory newProduct = Product({
            productId: nextProductId,
            batchId: batchId,
            farmer: msg.sender,
            productName: productName,
            category: category,
            origin: origin,
            harvestDate: harvestDate,
            expiryDate: expiryDate,
            quantity: quantity,
            unit: unit,
            ipfsHash: ipfsHash,
            isActive: true,
            currentOwner: msg.sender,
            createdAt: block.timestamp
        });
        
        products[batchId] = newProduct;
        productsById[nextProductId] = newProduct;
        allBatchIds.push(batchId);
        
        emit ProductCreated(nextProductId, batchId, msg.sender);
        nextProductId++;
    }

    // Event Management Functions
    function addEvent(
        string memory batchId,
        EventType eventType,
        string memory location,
        string memory ipfsHash,
        string memory notes
    ) external onlyVerifiedUser productExists(batchId) {
        Product storage product = products[batchId];
        
        // Role-based access control for events
        if (eventType == EventType.HARVEST) {
            require(users[msg.sender].role == UserRole.FARMER, "Only farmers can add harvest events");
        } else if (eventType == EventType.PROCESSING) {
            require(users[msg.sender].role == UserRole.PROCESSOR, "Only processors can add processing events");
        } else if (eventType == EventType.TRANSPORT_START || eventType == EventType.TRANSPORT_END) {
            require(users[msg.sender].role == UserRole.TRANSPORTER, "Only transporters can add transport events");
        } else if (eventType == EventType.WAREHOUSE_IN || eventType == EventType.WAREHOUSE_OUT) {
            require(users[msg.sender].role == UserRole.WAREHOUSE, "Only warehouses can add warehouse events");
        } else if (eventType == EventType.RETAIL_RECEIVE || eventType == EventType.SALE) {
            require(users[msg.sender].role == UserRole.RETAILER, "Only retailers can add retail events");
        }

        SupplyChainEvent memory newEvent = SupplyChainEvent({
            eventId: nextEventId,
            batchId: batchId,
            eventType: eventType,
            actor: msg.sender,
            location: location,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            notes: notes
        });

        productEvents[batchId].push(newEvent);
        
        // Update current owner based on event type
        if (eventType == EventType.PROCESSING || eventType == EventType.TRANSPORT_START || 
            eventType == EventType.WAREHOUSE_IN || eventType == EventType.RETAIL_RECEIVE) {
            product.currentOwner = msg.sender;
        }
        
        emit EventAdded(nextEventId, batchId, eventType, msg.sender);
        nextEventId++;
    }

    // View Functions
    function getProduct(string memory batchId) external view productExists(batchId) returns (Product memory) {
        return products[batchId];
    }

    function getEvents(string memory batchId) external view productExists(batchId) returns (SupplyChainEvent[] memory) {
        return productEvents[batchId];
    }

    function getProductSummary(string memory batchId) external view productExists(batchId) returns (
        string memory productName,
        string memory category,
        string memory origin,
        uint256 harvestDate,
        uint256 expiryDate,
        uint256 quantity,
        string memory unit,
        address currentOwner,
        uint256 eventCount
    ) {
        Product memory product = products[batchId];
        return (
            product.productName,
            product.category,
            product.origin,
            product.harvestDate,
            product.expiryDate,
            product.quantity,
            product.unit,
            product.currentOwner,
            productEvents[batchId].length
        );
    }

    function getUser(address userAddress) external view returns (User memory) {
        return users[userAddress];
    }

    function getCurrentUser() external view returns (User memory) {
        return users[msg.sender];
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return allBatchIds;
    }

    function getRegisteredUsers() external view returns (address[] memory) {
        return registeredUsers;
    }

    function getProductCount() external view returns (uint256) {
        return allBatchIds.length;
    }

    function getEventCount(string memory batchId) external view returns (uint256) {
        return productEvents[batchId].length;
    }

    // Admin Functions
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }

    function withdraw() external onlyAdmin {
        payable(admin).transfer(address(this).balance);
    }

    // Utility Functions
    function isUserRegistered(address userAddress) external view returns (bool) {
        return users[userAddress].userAddress != address(0);
    }

    function isUserVerified(address userAddress) external view returns (bool) {
        return users[userAddress].isVerified && users[userAddress].isActive;
    }

    function getContractInfo() external view returns (
        address contractAddress,
        address adminAddress,
        uint256 totalProducts,
        uint256 totalUsers
    ) {
        return (
            address(this),
            admin,
            allBatchIds.length,
            registeredUsers.length
        );
    }
}
