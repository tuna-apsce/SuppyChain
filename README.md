# AgriTrace - Hệ thống Truy xuất Nguồn gốc Nông sản Blockchain

## Tổng quan

AgriTrace là một hệ thống truy xuất nguồn gốc nông sản được xây dựng trên công nghệ blockchain, đảm bảo tính minh bạch, bảo mật và có thể kiểm chứng trong toàn bộ chuỗi cung ứng nông nghiệp từ trang trại đến bàn ăn.

## Tính năng chính

### 🔐 Bảo mật và Minh bạch
- Ghi chép bất biến trên blockchain đảm bảo tính toàn vẹn dữ liệu
- Ngăn chặn việc giả mạo và thay đổi thông tin sản phẩm
- Truy xuất đầy đủ lịch sử sản phẩm từ thu hoạch đến tiêu dùng

### 📱 Theo dõi Thời gian Thực
- Theo dõi sản phẩm qua từng bước của chuỗi cung ứng
- Cập nhật thông tin theo thời gian thực
- Thông báo tức thì về các sự kiện quan trọng

### 📱 Thân thiện với Mobile
- Quét mã QR bằng thiết bị di động để xem thông tin sản phẩm
- Giao diện responsive tối ưu cho mọi thiết bị
- Hỗ trợ camera và tải file ảnh

### 👥 Hỗ trợ Đa Vai trò
- **Nông dân (Farmer)**: Tạo sản phẩm và ghi nhận thu hoạch
- **Nhà chế biến (Processor)**: Xử lý và chế biến sản phẩm
- **Vận chuyển (Transporter)**: Vận chuyển sản phẩm
- **Kho bãi (Warehouse)**: Lưu trữ và quản lý kho
- **Bán lẻ (Retailer)**: Bán sản phẩm đến người tiêu dùng
- **Quản trị viên (Admin)**: Quản lý hệ thống và xác thực người dùng

### 📄 Lưu trữ Tài liệu
- Lưu trữ chứng chỉ và tài liệu trên IPFS
- Truy cập vĩnh viễn và bảo mật
- Hỗ trợ nhiều định dạng file

### 🌱 Bền vững
- Thúc đẩy thực hành nông nghiệp bền vững
- Tăng cường niềm tin của người tiêu dùng
- Hỗ trợ nông nghiệp hữu cơ và thương mại công bằng

## Công nghệ sử dụng

- **Blockchain**: BNB Smart Chain (BSC)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Blockchain Integration**: Web3.js
- **QR Code**: QRCode.js, QR-Scanner
- **Storage**: IPFS (InterPlanetary File System)
- **Smart Contract**: Solidity ^0.8.19

## Cài đặt và Triển khai

### Yêu cầu hệ thống

- Node.js (phiên bản 14 trở lên)
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)
- MetaMask hoặc ví blockchain tương thích
- Kết nối internet ổn định

### Cài đặt

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd supplychain
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Tải các thư viện cần thiết**
   ```bash
   # Windows
   npm run setup
   
   # Linux/Mac
   npm run setup-unix
   ```

4. **Khởi chạy ứng dụng**
   ```bash
   # Mở file index.html trong trình duyệt
   # Hoặc sử dụng local server
   python -m http.server 8000
   # Truy cập: http://localhost:8000
   ```

### Cấu hình Blockchain

1. **Cài đặt MetaMask**
   - Tải và cài đặt MetaMask extension
   - Tạo ví mới hoặc import ví hiện có
   - Thêm BNB Smart Chain network

2. **Cấu hình Smart Contract**
   - Deploy contract `AgriSupplyChain.sol` lên BSC
   - Cập nhật contract address trong `blockchain.js`
   - Cấu hình ABI và network settings

3. **Cấu hình IPFS**
   - Sử dụng IPFS gateway công cộng hoặc tự host
   - Cập nhật IPFS endpoint trong `ipfs.js`

## Hướng dẫn sử dụng

### Cho Người tiêu dùng

1. **Truy cập trang chủ**
   - Mở `index.html` trong trình duyệt
   - Kết nối ví MetaMask (tùy chọn)

2. **Quét mã QR sản phẩm**
   - Nhấn nút "Scan QR Code"
   - Cho phép truy cập camera
   - Quét mã QR trên sản phẩm

3. **Xem thông tin sản phẩm**
   - Xem lịch sử chuỗi cung ứng
   - Kiểm tra thông tin nông dân
   - Tải xuống tài liệu liên quan

### Cho Nông dân

1. **Đăng ký tài khoản**
   - Truy cập `register.html`
   - Chọn vai trò "Farmer"
   - Nhập thông tin công ty
   - Chờ admin xác thực

2. **Tạo sản phẩm mới**
   - Đăng nhập Farmer Dashboard
   - Nhấn "Create Product"
   - Điền thông tin sản phẩm:
     - Tên sản phẩm
     - Loại sản phẩm
     - Nguồn gốc
     - Ngày thu hoạch
     - Ngày hết hạn
     - Số lượng
     - Đơn vị
   - Tải lên tài liệu (tùy chọn)

3. **Ghi nhận sự kiện thu hoạch**
   - Chọn sản phẩm từ danh sách
   - Nhấn "Add Harvest Event"
   - Điền thông tin:
     - Vị trí thu hoạch
     - Ghi chú
     - Tài liệu chất lượng

### Cho Nhà chế biến

1. **Đăng ký và xác thực**
   - Đăng ký với vai trò "Processor"
   - Chờ admin xác thực

2. **Xử lý sản phẩm**
   - Truy cập Processor Dashboard
   - Chọn sản phẩm cần xử lý
   - Thêm sự kiện xử lý:
     - Phương pháp xử lý
     - Kiểm tra chất lượng
     - Tài liệu chứng nhận

### Cho Vận chuyển

1. **Đăng ký tài khoản**
   - Chọn vai trò "Transporter"
   - Cung cấp thông tin công ty vận chuyển

2. **Ghi nhận vận chuyển**
   - Nhận sản phẩm từ nông dân/nhà chế biến
   - Thêm sự kiện "Transport Start"
   - Giao hàng và thêm sự kiện "Transport End"

### Cho Kho bãi

1. **Quản lý kho**
   - Đăng ký với vai trò "Warehouse"
   - Nhận sản phẩm vào kho (Warehouse In)
   - Xuất kho (Warehouse Out)

### Cho Bán lẻ

1. **Bán hàng**
   - Đăng ký với vai trò "Retailer"
   - Nhận sản phẩm (Retail Receive)
   - Bán cho khách hàng (Sale)

### Cho Quản trị viên

1. **Quản lý người dùng**
   - Truy cập Admin Dashboard
   - Xem danh sách người dùng đăng ký
   - Xác thực hoặc từ chối người dùng
   - Kích hoạt/vô hiệu hóa tài khoản

2. **Giám sát hệ thống**
   - Xem thống kê tổng quan
   - Theo dõi sản phẩm và sự kiện
   - Quản lý hợp đồng thông minh

## Cấu trúc dự án

```
supplychain/
├── index.html                 # Trang chủ
├── register.html              # Đăng ký người dùng
├── admin-setup.html           # Thiết lập admin
├── admin-approval.html        # Phê duyệt admin
├── package.json              # Cấu hình npm
├── contracts/
│   └── AgriSupplyChain.sol   # Smart contract
├── assets/
│   ├── css/                  # Stylesheets
│   │   ├── main.css
│   │   ├── components.css
│   │   └── dashboard.css
│   ├── js/                   # JavaScript files
│   │   ├── app.js           # Ứng dụng chính
│   │   ├── blockchain.js    # Tích hợp blockchain
│   │   ├── ipfs.js          # Tích hợp IPFS
│   │   ├── utils.js         # Tiện ích
│   │   └── web3.min.js      # Web3 library
│   └── images/              # Hình ảnh
├── dashboard/               # Dashboards cho từng vai trò
│   ├── admin.html
│   ├── farmer.html
│   ├── processor.html
│   ├── transporter.html
│   ├── warehouse.html
│   └── retailer.html
└── test-*.html             # Các file test
```

## API và Smart Contract

### Smart Contract Functions

#### Quản lý người dùng
- `registerUser(role, companyName)`: Đăng ký người dùng mới
- `verifyUser(address)`: Xác thực người dùng (chỉ admin)
- `activateUser(address)`: Kích hoạt người dùng
- `deactivateUser(address)`: Vô hiệu hóa người dùng

#### Quản lý sản phẩm
- `createProduct(batchId, productName, category, origin, harvestDate, expiryDate, quantity, unit, ipfsHash)`: Tạo sản phẩm mới
- `addEvent(batchId, eventType, location, ipfsHash, notes)`: Thêm sự kiện chuỗi cung ứng

#### Truy vấn dữ liệu
- `getProduct(batchId)`: Lấy thông tin sản phẩm
- `getEvents(batchId)`: Lấy lịch sử sự kiện
- `getUser(address)`: Lấy thông tin người dùng
- `getAllBatchIds()`: Lấy danh sách tất cả batch ID

### Event Types

- `HARVEST`: Thu hoạch
- `PROCESSING`: Chế biến
- `TRANSPORT_START`: Bắt đầu vận chuyển
- `TRANSPORT_END`: Kết thúc vận chuyển
- `WAREHOUSE_IN`: Nhập kho
- `WAREHOUSE_OUT`: Xuất kho
- `RETAIL_RECEIVE`: Nhận hàng bán lẻ
- `SALE`: Bán hàng

## Bảo mật

### Smart Contract Security
- Sử dụng modifiers để kiểm soát quyền truy cập
- Validation đầu vào đầy đủ
- Tránh reentrancy attacks
- Safe math operations

### Frontend Security
- Sanitization HTML để tránh XSS
- Validation dữ liệu phía client
- Secure communication với blockchain
- IPFS content verification

## Khắc phục sự cố

### Lỗi thường gặp

1. **Không thể kết nối ví**
   - Kiểm tra MetaMask đã cài đặt
   - Đảm bảo đã thêm BSC network
   - Kiểm tra kết nối internet

2. **Lỗi camera không hoạt động**
   - Sử dụng HTTPS hoặc localhost
   - Cho phép quyền truy cập camera
   - Sử dụng tùy chọn tải file ảnh

3. **Lỗi IPFS**
   - Kiểm tra kết nối IPFS gateway
   - Thử gateway khác
   - Kiểm tra file size limits

4. **Lỗi Smart Contract**
   - Kiểm tra contract address
   - Xác nhận network đúng
   - Kiểm tra gas fees

### Debug Mode

Kích hoạt debug mode bằng cách thêm `?debug=true` vào URL:
```
http://localhost:8000/index.html?debug=true
```

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm thông tin.

## Liên hệ

- **Email**: nguyenanhtu10203@gmail.com
- **Phone**: 0339010737
---

**AgriTrace** - Minh bạch từ trang trại đến bàn ăn 🌱
