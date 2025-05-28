// Test script to validate functionality
console.log("🧪 Starting application functionality tests...");

// Test DOM elements existence
function testDOMElements() {
    console.log("Testing DOM elements...");
    const requiredElements = [
        'login', 'registro', 'menu', 'inventarioSection',
        'btnLogin', 'btnRegistro', 'btnLogout'
    ];
    
    let missing = [];
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missing.push(id);
        }
    });
    
    if (missing.length === 0) {
        console.log("✅ All required DOM elements found");
        return true;
    } else {
        console.log("❌ Missing DOM elements:", missing);
        return false;
    }
}

// Test module imports
async function testModuleImports() {
    console.log("Testing module imports...");
    try {
        const modules = [
            './js/dom.js',
            './js/utils.js', 
            './js/ui.js',
            './js/auth.js',
            './js/inventory.js',
            './js/admin.js',
            './js/reports.js',
            './js/security.js'
        ];
        
        for (const modulePath of modules) {
            await import(modulePath);
        }
        
        console.log("✅ All modules imported successfully");
        return true;
    } catch (error) {
        console.log("❌ Module import error:", error);
        return false;
    }
}

// Test basic functionality
async function testBasicFunctionality() {
    console.log("Testing basic functionality...");
    
    try {
        // Test DOM module
        const { DOM } = await import('./js/dom.js');
        if (!DOM || !DOM.loginSection) {
            throw new Error("DOM module not working correctly");
        }
        
        // Test utils module
        const { validarNombreUsuario, validarPassword } = await import('./js/utils.js');
        if (typeof validarNombreUsuario !== 'function' || typeof validarPassword !== 'function') {
            throw new Error("Utils module not working correctly");
        }
        
        // Test UI module
        const { mostrarMensajeLogin, mostrarMenu } = await import('./js/ui.js');
        if (typeof mostrarMensajeLogin !== 'function' || typeof mostrarMenu !== 'function') {
            throw new Error("UI module not working correctly");
        }
        
        console.log("✅ Basic functionality tests passed");
        return true;
    } catch (error) {
        console.log("❌ Basic functionality test failed:", error);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log("🚀 Running comprehensive application tests...");
    
    const results = {
        dom: testDOMElements(),
        modules: await testModuleImports(),
        functionality: await testBasicFunctionality()
    };
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
        console.log("🎉 All tests passed! The modular refactoring was successful.");
        console.log("📋 Test Results:", results);
    } else {
        console.log("⚠️ Some tests failed:", results);
    }
    
    return allPassed;
}

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}
