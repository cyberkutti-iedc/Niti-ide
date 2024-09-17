# Niti IDE

**Niti IDE** is an intuitive development environment for flashing the Niti framework onto Niti boards. This IDE combines a user-friendly interface with robust features to streamline your embedded development workflow.

## Features

### Integrated Monaco Editor
- **Syntax Highlighting**: Supports Rust syntax with color-coded elements.
- **IntelliSense**: Offers code suggestions and autocompletions.
- **Customizable Font Sizes**: Adjust the editor view to your preference.

### Serial Monitor
- **Real-Time Data Display**: View incoming data from your Niti board as it arrives.
- **Auto-Read**: Toggle automatic data reading at configurable intervals.
- **Send Data**: Easily send data commands to your board.

### File Management
- **Create New Files**: Start new projects with a single click.
- **Open and Save**: Manage multiple code files effortlessly.

### Build and Run
- **Compile Code**: Build your Rust projects directly from the IDE.
- **Deploy Firmware**: Flash your code to the Niti board with a single action.

### Thematic Flexibility
- **Light and Dark Modes**: Switch between themes to reduce eye strain.

### User-Friendly Interface
- **Simplified Menus**: Easy access to file operations, view settings, and help resources.

## How It Works

### Tauri

Niti IDE is built using **Tauri**, a modern toolkit for creating native applications with web technologies. Tauri allows developers to build lightweight and secure desktop applications using their web development skills.

### Technologies Used

- **TypeScript (TS)**: A typed superset of JavaScript for better code quality.
- **Rust**: A systems programming language known for its performance and safety.
- **React**: A JavaScript library for building dynamic user interfaces.

### Why Rust?

Rust is chosen for its:
- **Memory Safety**: Prevents common programming errors.
- **Performance**: Delivers high efficiency by compiling to machine code.
- **Concurrency**: Simplifies concurrent programming without data races.

### Niti Framework

The **Niti framework** supports firmware development for embedded systems. The current version of the board is the V2560.

## Installation

### Prerequisites

Before installing Niti IDE, ensure you have the following installed:

- **C++ Compiler**: Required for building the project.
- **Rust**: Needed for developing and compiling the Niti framework.

### Installing C++

#### Windows

1. **Download and Install MinGW**:
   - Visit [MinGW](https://sourceforge.net/projects/mingw/) and download the installer.
   - Run the installer and select the `mingw32-base` and `mingw32-gcc-g++` packages.

2. **Add MinGW to System Path**:
   - Open Control Panel -> System and Security -> System.
   - Click on "Advanced system settings" and then "Environment Variables."
   - Under "System variables," find `Path`, click "Edit," and add the path to MinGW's `bin` directory.

#### Linux

1. **Install GCC**:
   - Open a terminal and run:
     ```bash
     sudo apt update
     sudo apt install build-essential
     ```

#### macOS

1. **Install Xcode Command Line Tools**:
   - Open a terminal and run:
     ```bash
     xcode-select --install
     ```

### Installing Rust

1. **Download and Install Rust**:
   - Visit [Rust's official website](https://www.rust-lang.org/tools/install) and follow the installation instructions.
   - For a quick installation, open a terminal and run:
     ```bash
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     ```

2. **Set Up Environment**:
   - After installation, restart your terminal or run:
     ```bash
     source $HOME/.cargo/env
     ```

### Installation of Niti IDE

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/cyberkutti-iedc/Niti-ide.git
   cd Niti-ide
   ```

2. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Project**:
   ```bash
   npm run build
   ```

4. **Run the Application**:
   ```bash
   npm run start
   ```

## Usage

1. **Open Niti IDE**.
2. **Create or Open a File**: Use the File menu to start or edit your code.
3. **Write Code**: Utilize the Monaco Editor for code development.
4. **Build Project**: Compile your code via the Build menu.
5. **Flash to Board**: Deploy firmware to the Niti board from the Run menu.
6. **Monitor Serial Data**: Use the Serial Monitor to interact with your board.

## Contributing

1. **Fork the Repository**.
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/your-username/niti-ide.git
   ```
3. **Create a Branch**:
   ```bash
   git checkout -b feature-branch
   ```
4. **Make Your Changes**.
5. **Commit and Push**:
   ```bash
   git commit -m "Add new feature"
   git push origin feature-branch
   ```
6. **Open a Pull Request**.

## License

Niti IDE is open-source software licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please reach out to us at [cyberkutti@gmail.com](mailto:cyberkutti@gmail.com).

---

**Niti IDE** is designed to streamline your development process for Niti boards, combining an intuitive interface with powerful features for efficient code management and deployment. Happy coding!
```

