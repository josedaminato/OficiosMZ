/**
 * Test para verificar que la refactorización del frontend funciona correctamente
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();

function testFileExists(filePath) {
    const fullPath = join(PROJECT_ROOT, filePath);
    return existsSync(fullPath);
}

function testFileContains(filePath, content) {
    const fullPath = join(PROJECT_ROOT, filePath);
    if (!existsSync(fullPath)) return false;
    
    const fileContent = readFileSync(fullPath, 'utf8');
    return fileContent.includes(content);
}

function testImportExists(filePath, importPath) {
    const fullPath = join(PROJECT_ROOT, filePath);
    if (!existsSync(fullPath)) return false;
    
    const fileContent = readFileSync(fullPath, 'utf8');
    return fileContent.includes(`import { ${importPath} } from './useApi'`) || 
           fileContent.includes(`import ${importPath} from './useApi'`);
}

function main() {
    console.log('🧪 Iniciando tests de refactorización frontend...\n');
    
    const tests = [
        // Test 1: Archivo useApi existe
        {
            name: 'useApi hook existe',
            test: () => testFileExists('src/hooks/useApi.jsx'),
            expected: true
        },
        
        // Test 2: useApi contiene funciones necesarias
        {
            name: 'useApi contiene useApi',
            test: () => testFileContains('src/hooks/useApi.jsx', 'export const useApi ='),
            expected: true
        },
        
        {
            name: 'useApi contiene useAsyncState',
            test: () => testFileContains('src/hooks/useApi.jsx', 'export const useAsyncState ='),
            expected: true
        },
        
        {
            name: 'useApi contiene useCrudApi',
            test: () => testFileContains('src/hooks/useApi.jsx', 'export const useCrudApi ='),
            expected: true
        },
        
        // Test 3: useRatings refactorizado
        {
            name: 'useRatings importa useApi',
            test: () => testImportExists('src/hooks/useRatings.jsx', 'useApi, useAsyncState'),
            expected: true
        },
        
        {
            name: 'useRatings usa executeApi',
            test: () => testFileContains('src/hooks/useRatings.jsx', 'executeApi'),
            expected: true
        },
        
        // Test 4: useNotifications refactorizado
        {
            name: 'useNotifications importa useApi',
            test: () => testImportExists('src/hooks/useNotifications.jsx', 'useApi, useAsyncState'),
            expected: true
        },
        
        {
            name: 'useNotifications usa executeApi',
            test: () => testFileContains('src/hooks/useNotifications.jsx', 'executeApi'),
            expected: true
        },
        
        // Test 5: useDisputes refactorizado
        {
            name: 'useDisputes importa useApi',
            test: () => testImportExists('src/hooks/useDisputes.jsx', 'useApi, useAsyncState'),
            expected: true
        },
        
        {
            name: 'useDisputes usa executeApi',
            test: () => testFileContains('src/hooks/useDisputes.jsx', 'executeApi'),
            expected: true
        },
        
        // Test 6: usePayments refactorizado
        {
            name: 'usePayments importa useApi',
            test: () => testImportExists('src/hooks/usePayments.jsx', 'useApi, useAsyncState'),
            expected: true
        },
        
        {
            name: 'usePayments usa executeApi',
            test: () => testFileContains('src/hooks/usePayments.jsx', 'executeApi'),
            expected: true
        },
        
        // Test 7: Eliminación de código duplicado
        {
            name: 'useRatings no usa axios',
            test: () => !testFileContains('src/hooks/useRatings.jsx', 'import axios'),
            expected: true
        },
        
        {
            name: 'useNotifications no usa axios',
            test: () => !testFileContains('src/hooks/useNotifications.jsx', 'import axios'),
            expected: true
        },
        
        {
            name: 'useDisputes no usa axios',
            test: () => !testFileContains('src/hooks/useDisputes.jsx', 'import axios'),
            expected: true
        },
        
        {
            name: 'usePayments no usa axios',
            test: () => !testFileContains('src/hooks/usePayments.jsx', 'import axios'),
            expected: true
        },
        
        // Test 8: Eliminación de getAuthHeaders duplicado
        {
            name: 'useRatings no tiene getAuthHeaders',
            test: () => !testFileContains('src/hooks/useRatings.jsx', 'getAuthHeaders'),
            expected: true
        },
        
        {
            name: 'useNotifications no tiene getAuthHeaders',
            test: () => !testFileContains('src/hooks/useNotifications.jsx', 'getAuthHeaders'),
            expected: true
        },
        
        {
            name: 'usePayments no tiene getAuthHeaders',
            test: () => !testFileContains('src/hooks/usePayments.jsx', 'getAuthHeaders'),
            expected: true
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    console.log('='.repeat(60));
    console.log('🧪 EJECUTANDO TESTS DE REFACTORIZACIÓN FRONTEND');
    console.log('='.repeat(60));
    
    tests.forEach((test, index) => {
        try {
            const result = test.test();
            const status = result === test.expected ? '✅' : '❌';
            const message = result === test.expected ? 'PASSED' : 'FAILED';
            
            console.log(`${status} Test ${index + 1}: ${test.name} - ${message}`);
            
            if (result === test.expected) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`❌ Test ${index + 1}: ${test.name} - ERROR: ${error.message}`);
            failed++;
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE TESTS');
    console.log('='.repeat(60));
    console.log(`✅ Pasaron: ${passed}/${tests.length}`);
    console.log(`❌ Fallaron: ${failed}/${tests.length}`);
    
    if (failed === 0) {
        console.log('\n🎉 ¡TODOS LOS TESTS PASARON! La refactorización frontend fue exitosa.');
        console.log('\n📋 BENEFICIOS OBTENIDOS:');
        console.log('✅ Código centralizado en useApi');
        console.log('✅ Eliminación de duplicación de código');
        console.log('✅ Manejo unificado de autenticación');
        console.log('✅ Manejo consistente de loading/error');
        console.log('✅ Código más mantenible y escalable');
        return true;
    } else {
        console.log(`\n⚠️  ${failed} tests fallaron. Revisar la implementación.`);
        return false;
    }
}

if (require.main === module) {
    const success = main();
    process.exit(success ? 0 : 1);
}

module.exports = { main };
