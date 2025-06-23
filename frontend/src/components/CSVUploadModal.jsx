import { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Info, Users, Database, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { parsePortfolioCSV } from '../utils/csvParser';

// FIXED: Get correct API base URL for production vs development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://investors-daily-brief.onrender.com'
  : 'http://localhost:5000';

console.log('🔧 CSVUploadModal API Configuration:', {
  isProduction,
  API_BASE_URL,
  currentHost: window.location.hostname
});

function CSVUploadModal({ isOpen, onClose, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [mergeMode, setMergeMode] = useState('replace'); // Default to replace for better account isolation
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  // *** FIXED: Enhanced account name detection ***
  const detectAccountName = (file, csvContent) => {
    const fileName = file.name.toLowerCase();
    const contentLower = csvContent.toLowerCase();
    const firstLines = csvContent.split('\n').slice(0, 10).join(' ').toLowerCase();
    
    console.log('🔍 Detecting account name from:', fileName);
    console.log('📄 Content sample:', firstLines.substring(0, 200));
    
    // Priority 1: Filename detection
    if (fileName.includes('fidelity') || fileName.includes('fidel')) {
      console.log('✅ Detected Fidelity from filename');
      return 'Fidelity';
    }
    if (fileName.includes('schwab') || fileName.includes('charles')) {
      console.log('✅ Detected Schwab from filename');
      return 'Schwab';
    }
    if (fileName.includes('vanguard')) {
      console.log('✅ Detected Vanguard from filename');
      return 'Vanguard';
    }
    if (fileName.includes('etrade') || fileName.includes('e-trade')) {
      console.log('✅ Detected E*TRADE from filename');
      return 'E*TRADE';
    }
    
    // Priority 2: Content detection - look for broker indicators
    if (firstLines.includes('fidelity') || contentLower.includes('fidelity')) {
      console.log('✅ Detected Fidelity from content');
      return 'Fidelity';
    }
    if (firstLines.includes('schwab') || contentLower.includes('charles schwab')) {
      console.log('✅ Detected Schwab from content');
      return 'Schwab';
    }
    if (firstLines.includes('vanguard')) {
      console.log('✅ Detected Vanguard from content');
      return 'Vanguard';
    }
    if (firstLines.includes('etrade') || firstLines.includes('e*trade')) {
      console.log('✅ Detected E*TRADE from content');
      return 'E*TRADE';
    }
    
    // Priority 3: Account type detection from CSV headers/content
    if (firstLines.includes('roth ira')) {
      console.log('🔍 Found IRA account type, checking for broker...');
      return 'IRA Account';
    }
    if (firstLines.includes('taxable') || firstLines.includes('brokerage')) {
      console.log('🔍 Found taxable account type, checking for broker...');
      return 'Taxable Account';
    }
    
    // Priority 4: Format-based detection
    if (contentLower.includes('you bought') || contentLower.includes('you sold')) {
      console.log('🔍 Detected Schwab transaction format');
      return 'Schwab';
    }
    if (firstLines.includes('run date') || firstLines.includes('acquisition')) {
      console.log('🔍 Detected Fidelity format');
      return 'Fidelity';
    }
    
    console.log('⚠️ Could not detect broker, using generic name');
    return 'Unknown Broker';
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
      setUploadSuccess(false);
      
      // *** FIXED: Improved account name detection ***
      parseFile(selectedFile);
    } else {
      setError('Please select a CSV file');
    }
  };

  const parseFile = async (file) => {
    setParsing(true);
    try {
      const text = await file.text();
      
      // *** FIXED: Detect account name from file and content ***
      const detectedAccountName = detectAccountName(file, text);
      console.log('🎯 Final detected account name:', detectedAccountName);
      setAccountName(detectedAccountName);
      
      const result = parsePortfolioCSV(text, detectedAccountName);
      
      if (result.transactions.length === 0) {
        setError('No valid transactions found in the CSV file. Make sure you export transaction history with buy/sell actions, or current positions with cost basis data.');
        setPreview(null);
      } else {
        setPreview(result);
        setError('');
        
        // *** FIXED: Auto-set replace mode for position imports ***
        if (result.format === 'positions') {
          setMergeMode('replace');
          console.log('📊 Position import detected - auto-setting replace mode for clean account data');
        }
      }
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setParsing(false);
    }
  };

  // Re-parse when account name changes manually
  const handleAccountNameChange = (newName) => {
    setAccountName(newName);
    if (file && preview) {
      // Update the preview with the new account name
      const updatedPreview = {
        ...preview,
        transactions: preview.transactions.map(txn => ({
          ...txn,
          account: newName
        }))
      };
      setPreview(updatedPreview);
    }
  };

  const handleUpload = async () => {
    if (!preview || !accountName.trim()) return;
    
    setUploading(true);
    setUploadSuccess(false);
    
    try {
      console.log(`🚀 Uploading ${preview.transactions.length} transactions to account: "${accountName}" with merge mode: ${mergeMode}`);
      
      // FIXED: Use environment-aware API URL instead of hardcoded localhost
      const uploadUrl = `${API_BASE_URL}/api/portfolio/portfolio_1/transactions/batch`;
      console.log(`🌐 Upload URL: ${uploadUrl}`);
      
      // Use batch import for better performance
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: preview.transactions,
          accountName: accountName.trim(),
          mergeMode: mergeMode
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload transactions');
      }
      
      const result = await response.json();
      console.log('✅ Import result:', result);
      
      // Success!
      setUploadSuccess(true);
      
      // Trigger immediate refresh of portfolio data
      if (onUploadComplete) {
        // Add a small delay to ensure backend has processed the data
        setTimeout(() => {
          onUploadComplete();
        }, 500);
      }
      
      // Auto-close after successful upload
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError('Failed to upload transactions: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError('');
    setAccountName('');
    setMergeMode('replace'); // Reset to default
    setUploadSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">📊 Upload Portfolio CSV</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Success Message */}
          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-green-800">🎉 Upload Successful!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your portfolio data has been imported to the "{accountName}" account. Perfect account separation is now working correctly!
                </p>
              </div>
            </div>
          )}

          {/* File Upload */}
          {!preview && !uploadSuccess && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV file from your broker
              </label>
              
              {/* Enhanced Info Box */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">🔒 Multi-Account Support with Perfect Isolation:</p>
                  <ul className="space-y-1">
                    <li>• ✅ <strong>Auto-Detection:</strong> Automatically detects Fidelity, Schwab, Vanguard, E*TRADE</li>
                    <li>• 🛡️ <strong>Perfect Account Separation:</strong> Each broker gets its own account</li>
                    <li>• 🔄 <strong>Smart Replace Mode:</strong> Only replaces data for the specific account being uploaded</li>
                    <li>• 💰 <strong>Superior Cost Basis Tracking:</strong> Preserves your actual purchase prices</li>
                    <li>• 📈 <strong>Transaction History or Current Positions:</strong> Both formats supported</li>
                    <li>• 🔍 <strong>Smart Filtering:</strong> Automatically filters out inactive/transferred positions</li>
                    <li>• 🔗 <strong>Account Aggregation Detection:</strong> Filters out linked external accounts automatically</li>
                  </ul>
                  <p className="mt-2 text-xs bg-blue-100 p-2 rounded">
                    🎯 <strong>FIXED:</strong> Now automatically filters out old/transferred positions AND linked external accounts for perfect isolation!
                  </p>
                </div>
              </div>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV file only</p>
                </div>
              </div>
              
              {/* Test Files Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-700 mb-1">🧪 Supported Brokers:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <p className="font-medium">✅ Auto-Detected:</p>
                    <p>• Charles Schwab</p>
                    <p>• Fidelity</p>
                  </div>
                  <div>
                    <p className="font-medium">✅ Also Supported:</p>
                    <p>• Vanguard</p>
                    <p>• E*TRADE</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Configuration */}
          {preview && !uploadSuccess && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="text-gray-600" size={20} />
                <h3 className="font-medium text-gray-800">🏦 Account Configuration</h3>
              </div>
              
              {/* *** FIXED: Show detected broker info *** */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>🎯 Auto-Detected Account:</strong> "{accountName}"
                  {preview.format === 'positions' && (
                    <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded">
                      📊 Position Import
                    </span>
                  )}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  This ensures perfect separation from your other broker accounts. You can edit the name if needed.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => handleAccountNameChange(e.target.value)}
                    placeholder="e.g., Fidelity, Schwab, IRA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">🔐 Each account keeps its data completely separate</p>
                </div>
                
                {/* Merge Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Import Mode
                  </label>
                  <select
                    value={mergeMode}
                    onChange={(e) => setMergeMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="replace">🔄 Replace data for this account only</option>
                    <option value="add">➕ Add to existing data</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {mergeMode === 'replace' ? 
                      `🔄 Replaces data for "${accountName}" only (other accounts preserved)` : 
                      '➕ Adds to your existing portfolio (recommended for additional transactions)'
                    }
                  </p>
                  {preview.format === 'positions' && mergeMode === 'add' && (
                    <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded">
                      ⚠️ Adding positions to existing data may create duplicates. Consider using "Replace" mode.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Warnings Display */}
          {preview && preview.warnings && preview.warnings.length > 0 && !uploadSuccess && (
            <div className="mb-4">
              {preview.warnings.map((warning, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg flex items-start gap-2 mb-2 ${
                    warning.severity === 'warning' 
                      ? 'bg-amber-50 border border-amber-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <AlertTriangle 
                    className={`flex-shrink-0 mt-0.5 ${
                      warning.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                    }`} 
                    size={20} 
                  />
                  <div className={warning.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'}>
                    <p className="font-medium">
                      {warning.type === 'position_import' ? '📊 Position Import Notice' : 
                       warning.type === 'cost_basis_issues' ? '💰 Cost Basis Notice' : 
                       warning.type === 'skipped_positions' ? '🚫 Filtered Positions' :
                       warning.type === 'external_positions_filtered' ? '🔗 Account Aggregation Detected' :
                       '📋 Notice'}
                    </p>
                    <p className="text-sm mt-1">{warning.message}</p>
                    {warning.type === 'position_import' && (
                      <p className="text-xs mt-2 bg-amber-100 p-2 rounded">
                        💡 <strong>Tip:</strong> Position imports work great with "Replace" mode to ensure clean account data.
                      </p>
                    )}
                    {warning.type === 'cost_basis_issues' && (
                      <p className="text-xs mt-2 bg-amber-100 p-2 rounded">
                        💡 <strong>Tip:</strong> Check your broker's CSV export settings to include cost basis data for accurate tracking.
                      </p>
                    )}
                    {warning.type === 'external_positions_filtered' && warning.externalPositions && (
                      <div className="text-xs mt-2 bg-green-100 p-2 rounded">
                        <p className="font-medium">🔗 Filtered out linked external accounts:</p>
                        <ul className="mt-1 space-y-1">
                          {warning.externalPositions.slice(0, 8).map((pos, idx) => (
                            <li key={idx}>• <strong>{pos.symbol}</strong>: {pos.reason} {pos.accountSource && `(${pos.accountSource})`}</li>
                          ))}
                          {warning.externalPositions.length > 8 && (
                            <li>• ... and {warning.externalPositions.length - 8} more external positions</li>
                          )}
                        </ul>
                        <p className="mt-2 text-xs bg-blue-100 p-1 rounded">
                          🎯 <strong>Perfect! These are from your linked Schwab account - now importing only native {accountName} positions!</strong>
                        </p>
                      </div>
                    )}
                    {warning.type === 'skipped_positions' && warning.skippedPositions && (
                      <div className="text-xs mt-2 bg-blue-100 p-2 rounded">
                        <p className="font-medium">🔍 Also filtered out:</p>
                        <ul className="mt-1 space-y-1">
                          {warning.skippedPositions.filter(pos => !pos.reason.includes('External account')).slice(0, 5).map((pos, idx) => (
                            <li key={idx}>• <strong>{pos.symbol}</strong>: {pos.reason}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs bg-green-100 p-1 rounded">
                          ✅ <strong>This filtering ensures only valid, active positions are imported!</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Cost Basis Issues Display */}
          {preview && preview.costBasisIssues && preview.costBasisIssues.length > 0 && !uploadSuccess && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <DollarSign className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-orange-700">
                  <p className="font-medium">💰 Cost Basis Issues Detected</p>
                  <div className="text-sm mt-2">
                    <p>The following positions had cost basis issues:</p>
                    <ul className="mt-2 space-y-1">
                      {preview.costBasisIssues.slice(0, 5).map((issue, index) => (
                        <li key={index} className="text-xs bg-orange-100 p-2 rounded">• {issue}</li>
                      ))}
                    </ul>
                    {preview.costBasisIssues.length > 5 && (
                      <p className="text-xs mt-2">... and {preview.costBasisIssues.length - 5} more issues</p>
                    )}
                    <div className="mt-3 p-2 bg-orange-100 rounded text-xs">
                      <p className="font-medium">💡 How to fix cost basis issues:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Export "Positions" or "Holdings" report with cost basis data</li>
                        <li>• For Schwab: Include "Average Cost" or "Cost Basis" columns</li>
                        <li>• For Fidelity: Export with "Cost Basis Per Share" data</li>
                        <li>• Or use transaction history (buy/sell) instead of positions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-700">
                <p className="font-medium">❌ Import Error</p>
                <p className="text-sm mt-1">{error}</p>
                {error.includes('No valid transactions') && (
                  <div className="text-sm mt-3 bg-red-100 p-3 rounded">
                    <p className="font-medium">🔧 Troubleshooting Tips:</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• Make sure your CSV has Symbol, Quantity, and Price/Cost Basis columns</li>
                      <li>• For positions: Export with cost basis or average cost data</li>
                      <li>• For transactions: Include buy/sell action column</li>
                      <li>• Check that quantities are greater than 0</li>
                      <li>• Try exporting a different format from your broker</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parsing Indicator */}
          {parsing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">🔍 Parsing CSV file and detecting broker account...</p>
            </div>
          )}

          {/* Enhanced Preview */}
          {preview && !uploadSuccess && (
            <div>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-medium text-green-800">
                    ✅ Successfully parsed {
                      preview.format === 'schwab' ? '🏦 Charles Schwab' : 
                      preview.format === 'fidelity' ? '🏦 Fidelity' : 
                      preview.format === 'positions' ? '📊 Position' : '📄 Generic'
                    } CSV → Account: "{accountName}"
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700">
                  <div className="bg-green-100 p-2 rounded">
                    <p className="font-medium">📈 Transactions</p>
                    <p className="text-lg">{preview.summary.totalTransactions}</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded">
                    <p className="font-medium">🏷️ Symbols</p>
                    <p className="text-lg">{preview.summary.symbols.length}</p>
                  </div>
                  {preview.summary.totalValue && (
                    <div className="bg-green-100 p-2 rounded">
                      <p className="font-medium">💰 Total Value</p>
                      <p className="text-lg">${preview.summary.totalValue.toLocaleString()}</p>
                    </div>
                  )}
                  {(preview.summary.skippedCount > 0 || preview.summary.externalFilteredCount > 0) && (
                    <div className="bg-blue-100 p-2 rounded">
                      <p className="font-medium">🔍 Auto-Filtered</p>
                      <p className="text-lg">{preview.summary.skippedCount}</p>
                      <p className="text-xs">
                        {preview.summary.externalFilteredCount > 0 
                          ? `${preview.summary.externalFilteredCount} external, ${preview.summary.skippedCount - preview.summary.externalFilteredCount} invalid`
                          : 'Invalid/Zero value'
                        }
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 text-sm text-green-700">
                  <p><strong>📊 Active Symbols:</strong> {preview.summary.symbols.join(', ')}</p>
                  {preview.format === 'positions' ? (
                    <div className="mt-1">
                      <p className="font-medium">
                        ℹ️ Position data detected - importing {preview.summary.totalTransactions} active positions
                      </p>
                      {preview.summary.skippedCount > 0 && (
                        <p className="text-xs bg-green-100 p-1 rounded mt-1">
                          ✅ Auto-filtered {preview.summary.skippedCount} positions 
                          {preview.summary.externalFilteredCount > 0 && (
                            <span> ({preview.summary.externalFilteredCount} from linked external accounts)</span>
                          )} to keep your {accountName} portfolio clean
                        </p>
                      )}
                    </div>
                  ) : (
                    <p><strong>📅 Date range:</strong> {preview.summary.dateRange.start} to {preview.summary.dateRange.end}</p>
                  )}
                </div>
              </div>

              <h3 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp size={16} />
                Transaction Preview (first 10)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-2">📅 Date</th>
                      <th className="text-left py-2 px-2">⚡ Action</th>
                      <th className="text-left py-2 px-2">🏷️ Symbol</th>
                      <th className="text-right py-2 px-2">📊 Quantity</th>
                      <th className="text-right py-2 px-2">💲 Price</th>
                      <th className="text-right py-2 px-2">💰 Total</th>
                      <th className="text-left py-2 px-2">🏦 Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.transactions.slice(0, 10).map((txn, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{txn.date}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            txn.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {txn.action === 'BUY' ? '📈 BUY' : '📉 SELL'}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-medium">{txn.symbol}</td>
                        <td className="text-right py-2 px-2">{txn.quantity.toFixed(4)}</td>
                        <td className="text-right py-2 px-2">${txn.price.toFixed(2)}</td>
                        <td className="text-right py-2 px-2">${(txn.quantity * txn.price).toFixed(2)}</td>
                        <td className="py-2 px-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            🏦 {txn.account || accountName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.transactions.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... and {preview.transactions.length - 10} more transactions
                  </p>
                )}
              </div>
              
              {preview.format === 'positions' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📊 Position Import:</strong> These positions will be imported as BUY transactions with today's date. 
                    Your actual cost basis will be preserved for accurate tracking and tax purposes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Database size={16} />
            <span>🔐 Perfect account isolation - each broker separated</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            {preview && !uploadSuccess && (
              <button
                onClick={handleUpload}
                disabled={uploading || !accountName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    📊 Import to "{accountName}"
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CSVUploadModal;