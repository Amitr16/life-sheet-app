import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, Calculator, Target, DollarSign, PiggyBank, User, LogOut, Save, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'
import ApiService from './services/api'
import './App.css'

function LifeSheetApp() {
  const { user, logout, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Core financial data based on Excel analysis
  const [formData, setFormData] = useState({
    age: '',
    currentAnnualGrossIncome: '',
    workTenureYears: '',
    totalAssetGrossMarketValue: '',
    totalLoanOutstandingValue: '',
    loanTenureYears: '',
    
    // Calculation assumptions
    lifespanYears: 85,
    incomeGrowthRate: 0.06,  // 6% inflation
    assetGrowthRate: 0.06    // 6% inflation
  })
  
  // Dynamic goals and expenses
  const [goals, setGoals] = useState([])
  const [expenses, setExpenses] = useState([])
  
  // Calculated values
  const [calculations, setCalculations] = useState({
    totalExistingAssets: 0,
    totalHumanCapital: 0,
    totalExistingLiabilities: 0,
    totalFutureExpenses: 0,
    totalFinancialGoals: 0,
    currentNetworth: 0,
    surplusDeficit: 0
  })

  const [chartData, setChartData] = useState([])
  const [financialProfile, setFinancialProfile] = useState(null)

  // 1. Add a new state for loans
  const [loans, setLoans] = useState([])

  // Load user's financial data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFinancialData()
      ApiService.getFinancialLoans(user.id).then(res => {
        setLoans(res.loans || [])
      })
    }
  }, [isAuthenticated, user])

  // Calculate financials when form data, goals, or expenses change
  useEffect(() => {
    if (formData.age && formData.currentAnnualGrossIncome) {
      calculateFinancials()
    }
  }, [formData, goals, expenses, loans])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getFinancialProfile(user.id)
      if (response && response.profile) {
        const profile = response.profile
        setFormData({
          age: profile.age || '',
          currentAnnualGrossIncome: profile.current_annual_gross_income || '',
          workTenureYears: profile.work_tenure_years || '',
          totalAssetGrossMarketValue: profile.total_asset_gross_market_value || '',
          totalLoanOutstandingValue: profile.total_loan_outstanding_value || '',
          loanTenureYears: profile.loan_tenure_years || '',
          lifespanYears: profile.lifespan_years || 85,
          incomeGrowthRate: profile.income_growth_rate || 0.06,
          assetGrowthRate: profile.asset_growth_rate || 0.06
        })
        setGoals(profile.goals || [])
        setExpenses(profile.expenses || [])
        setFinancialProfile(profile)
      } else {
        // If no profile, reset to defaults
        setFormData({
          age: '',
          currentAnnualGrossIncome: '',
          workTenureYears: '',
          totalAssetGrossMarketValue: '',
          totalLoanOutstandingValue: '',
          loanTenureYears: '',
          lifespanYears: 85,
          incomeGrowthRate: 0.06,
          assetGrowthRate: 0.06
        })
        setGoals([])
        setExpenses([])
        setLoans([])
        setFinancialProfile(null)
      }
    } catch (error) {
      // Handle error gracefully, do not crash
      setFormData({
        age: '',
        currentAnnualGrossIncome: '',
        workTenureYears: '',
        totalAssetGrossMarketValue: '',
        totalLoanOutstandingValue: '',
        loanTenureYears: '',
        lifespanYears: 85,
        incomeGrowthRate: 0.06,
        assetGrowthRate: 0.06
      })
      setGoals([])
      setExpenses([])
      setLoans([])
      setFinancialProfile(null)
      // Only log unexpected errors
      if (!error.message || (!error.message.toLowerCase().includes('not authenticated') && !error.message.toLowerCase().includes('not found'))) {
        console.error('Error loading financial data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const saveFinancialData = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      setSaving(true)
      
      // Map formData to backend snake_case keys
      const payload = {
        user_id: user.id,
        age: formData.age ? parseInt(formData.age) : null,
        current_annual_gross_income: formData.currentAnnualGrossIncome ? parseFloat(formData.currentAnnualGrossIncome) : null,
        work_tenure_years: formData.workTenureYears ? parseInt(formData.workTenureYears) : null,
        total_asset_gross_market_value: formData.totalAssetGrossMarketValue ? parseFloat(formData.totalAssetGrossMarketValue) : null,
        total_loan_outstanding_value: formData.totalLoanOutstandingValue ? parseFloat(formData.totalLoanOutstandingValue) : null,
        loan_tenure_years: formData.loanTenureYears ? parseInt(formData.loanTenureYears) : null,
        lifespan_years: formData.lifespanYears ? parseInt(formData.lifespanYears) : null,
        income_growth_rate: formData.incomeGrowthRate ? parseFloat(formData.incomeGrowthRate) : null,
        asset_growth_rate: formData.assetGrowthRate ? parseFloat(formData.assetGrowthRate) : null,
        goals: goals,
        expenses: expenses,
      };
      
      let profileResponse
      if (financialProfile) {
        profileResponse = await ApiService.updateFinancialProfile(financialProfile.id, payload)
      } else {
        profileResponse = await ApiService.createFinancialProfile(payload)
      }
      
      if (profileResponse.profile) {
        setFinancialProfile(profileResponse.profile)
        
        // Save goals and expenses separately
        for (const goal of goals) {
          if (goal.id) {
            await ApiService.updateFinancialGoal(goal.id, goal)
          } else {
            await ApiService.createFinancialGoal({
              user_id: user.id,
              profile_id: profileResponse.profile.id,
              ...goal
            })
          }
        }
        
        for (const expense of expenses) {
          if (expense.id) {
            await ApiService.updateFinancialExpense(expense.id, expense)
          } else {
            await ApiService.createFinancialExpense({
              user_id: user.id,
              profile_id: profileResponse.profile.id,
              ...expense
            })
          }
        }
        
        // Save loans
        for (const loan of loans) {
          if (loan.id && !loan.isNew) {
            await ApiService.updateFinancialLoan(loan.id, { ...loan, description: loan.name })
          } else if ((loan.name || loan.amount) && loan.isNew) {
            await ApiService.createFinancialLoan({
              user_id: user.id,
              profile_id: profileResponse.profile.id,
              description: loan.name,
              amount: loan.amount
            })
          }
        }
        
        alert('Financial data saved successfully!')
      }
    } catch (error) {
      console.error('Error saving financial data:', error)
      alert('Error saving data: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Reset all data
      setFormData({
        age: '',
        currentAnnualGrossIncome: '',
        workTenureYears: '',
        totalAssetGrossMarketValue: '',
        totalLoanOutstandingValue: '',
        loanTenureYears: '',
        lifespanYears: 85,
        incomeGrowthRate: 0.06,
        assetGrowthRate: 0.06
      })
      setGoals([])
      setExpenses([])
      setLoans([])
      setCalculations({
        totalExistingAssets: 0,
        totalHumanCapital: 0,
        totalExistingLiabilities: 0,
        totalFutureExpenses: 0,
        totalFinancialGoals: 0,
        currentNetworth: 0,
        surplusDeficit: 0
      })
      setChartData([])
      setFinancialProfile(null)
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const calculateFinancials = () => {
    const age = parseInt(formData.age) || 0
    const currentIncome = parseFloat(formData.currentAnnualGrossIncome) || 0
    const workTenure = parseInt(formData.workTenureYears) || 0
    console.log('Work Tenure for chart:', workTenure)
    const assets = parseFloat(formData.totalAssetGrossMarketValue) || 0
    const liabilities = loans.reduce((sum, loan) => sum + (parseFloat(loan.amount) || 0), 0)
    const lifespan = parseInt(formData.lifespanYears) || 85
    const incomeGrowthRate = parseFloat(formData.incomeGrowthRate) || 0.06
    const remainingLife = lifespan - age
    
    // Calculate Total Human Capital: Current Annual Gross Income × Work Tenure Years
    const totalHumanCapital = currentIncome * workTenure
    
    // Calculate Total Future Expenses
    const totalFutureExpenses = expenses.reduce((total, expense) => {
      return total + (expense.amount * remainingLife)
    }, 0)
    
    // Calculate Total Financial Goals
    const totalFinancialGoals = goals.reduce((total, goal) => {
      return total + goal.amount
    }, 0)
    
    // Calculate other values
    const totalExistingAssets = assets
    const totalExistingLiabilities = liabilities
    const currentNetworth = totalExistingAssets - totalExistingLiabilities
    const surplusDeficit = (totalExistingAssets + totalHumanCapital) - 
                          (totalExistingLiabilities + totalFutureExpenses + totalFinancialGoals)
    
    setCalculations({
      totalExistingAssets,
      totalHumanCapital,
      totalExistingLiabilities,
      totalFutureExpenses,
      totalFinancialGoals,
      currentNetworth,
      surplusDeficit
    })
    
    // Generate chart data
    generateChartData(age, currentIncome, assets, workTenure, incomeGrowthRate)
  }

  const generateChartData = (age, currentIncome, assets, workTenure, growthRate) => {
    const data = []
    const currentYear = new Date().getFullYear()
    let income = currentIncome
    for (let year = 0; year < workTenure; year++) {
      data.push({
        year: currentYear + year,
        age: age + year,
        income: Math.round(income)
      })
      income = income * (1 + growthRate)
    }
    setChartData(data)
  }

  // Dynamic Goals Management
  const addGoal = () => {
    const newGoal = {
      description: `Goal ${goals.length + 1}`,
      amount: 0,
      orderIndex: goals.length + 1
    }
    setGoals([...goals, newGoal])
  }

  const updateGoal = (index, field, value) => {
    const updatedGoals = [...goals]
    updatedGoals[index] = { ...updatedGoals[index], [field]: value }
    setGoals(updatedGoals)
  }

  const removeGoal = (index) => {
    const updatedGoals = goals.filter((_, i) => i !== index)
    setGoals(updatedGoals)
  }

  // Dynamic Expenses Management
  const addExpense = () => {
    const newExpense = {
      description: `Expense ${expenses.length + 1}`,
      amount: 0,
      orderIndex: expenses.length + 1
    }
    setExpenses([...expenses, newExpense])
  }

  const updateExpense = (index, field, value) => {
    const updatedExpenses = [...expenses]
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value }
    setExpenses(updatedExpenses)
  }

  const removeExpense = (index) => {
    const updatedExpenses = expenses.filter((_, i) => i !== index)
    setExpenses(updatedExpenses)
  }

  // 2. Add loan CRUD handlers using backend
  const addLoan = () => {
    setLoans([...loans, { description: '', amount: 0 }])
  }
  const updateLoan = (index, field, value) => {
    const updatedLoans = [...loans]
    updatedLoans[index] = { ...updatedLoans[index], [field]: value }
    setLoans(updatedLoans)
  }
  const removeLoan = (index) => {
    const updatedLoans = loans.filter((_, i) => i !== index)
    setLoans(updatedLoans)
  }

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`
    }
    return `₹${amount.toFixed(0)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-500 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Life Sheet</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user?.username || user?.email}!</span>
                  <Button
                    onClick={saveFinancialData}
                    disabled={saving}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Data
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login / Register
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Show warning if not authenticated */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
            <p>You are not logged in. You can use the calculator, but your data will not be saved unless you log in.</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5" />
                  <span>Financial Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Core Financial Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="income" className="text-sm font-medium text-gray-700">
                      Current Annual Gross Income & Work Tenure
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        id="income"
                        type="number"
                        placeholder="Rs. XX,XXX"
                        value={formData.currentAnnualGrossIncome}
                        onChange={(e) => setFormData({...formData, currentAnnualGrossIncome: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="XX years"
                        value={formData.workTenureYears}
                        onChange={(e) => setFormData({...formData, workTenureYears: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="assets" className="text-sm font-medium text-gray-700">
                      Total Asset Gross Market Value
                    </Label>
                    <Input
                      id="assets"
                      type="number"
                      placeholder="Enter your Gross Market Value"
                      value={formData.totalAssetGrossMarketValue}
                      onChange={(e) => setFormData({...formData, totalAssetGrossMarketValue: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  {/* Loans Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Outstanding Loans</Label>
                      <Button
                        onClick={addLoan}
                        size="sm"
                        variant="outline"
                        className="text-teal-600 border-teal-600 hover:bg-teal-50"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Loan
                      </Button>
                    </div>
                    {loans.length === 0 && (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        Click "Add Loan" to create your first loan
                      </div>
                    )}
                    {loans.map((loan, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <Input
                          type="text"
                          placeholder={`Loan ${idx + 1} Name`}
                          value={loan.description}
                          onChange={e => updateLoan(idx, 'description', e.target.value)}
                          className="w-1/2"
                        />
                        <Input
                          type="number"
                          placeholder="Loan Amount"
                          value={loan.amount}
                          onChange={e => updateLoan(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-1/2"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeLoan(idx)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Financial Goals */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Specific Financial Goals</Label>
                    <Button
                      onClick={addGoal}
                      size="sm"
                      variant="outline"
                      className="text-teal-600 border-teal-600 hover:bg-teal-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Goal
                    </Button>
                  </div>
                  
                  {goals.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Click "Add Goal" to create your first financial goal
                    </div>
                  )}
                  
                  {goals.map((goal, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-600">Goal {index + 1}</Label>
                        {goals.length > 1 && (
                          <Button
                            onClick={() => removeGoal(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Goal description"
                        value={goal.description || ''}
                        onChange={(e) => updateGoal(index, 'description', e.target.value)}
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Goal amount"
                        value={goal.amount || ''}
                        onChange={(e) => updateGoal(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Dynamic Annual Expenses */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">All Inclusive Annual Expenses</Label>
                    <Button
                      onClick={addExpense}
                      size="sm"
                      variant="outline"
                      className="text-teal-600 border-teal-600 hover:bg-teal-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Expense
                    </Button>
                  </div>
                  
                  {expenses.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Click "Add Expense" to create your first annual expense
                    </div>
                  )}
                  
                  {expenses.map((expense, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-600">Expense {index + 1}</Label>
                        {expenses.length > 1 && (
                          <Button
                            onClick={() => removeExpense(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Expense description"
                        value={expense.description || ''}
                        onChange={(e) => updateExpense(index, 'description', e.target.value)}
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Annual expense amount"
                        value={expense.amount || ''}
                        onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowAuthModal(true)
                    } else {
                      saveFinancialData()
                    }
                  }}
                  className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white font-medium py-3"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Set Financial Goals
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Life Sheet Display */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Life Sheet Summary */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <span>Life Sheet</span>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Surplus+ {formatCurrency(Math.abs(calculations.surplusDeficit))}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    
                    {/* Assets Column */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Total Existing Assets</span>
                        <span className="text-lg font-bold text-green-600">
                          + {formatCurrency(calculations.totalExistingAssets)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Total Human Capital</span>
                        <span className="text-lg font-bold text-green-600">
                          + {formatCurrency(calculations.totalHumanCapital)}
                        </span>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-800">Total</span>
                          <span className="text-xl font-bold text-green-600">
                            + {formatCurrency(calculations.totalExistingAssets + calculations.totalHumanCapital)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Liabilities Column */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Total Existing Liabilities</span>
                        <span className="text-lg font-bold text-red-600">
                          - {formatCurrency(calculations.totalExistingLiabilities)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Total Future Expense</span>
                        <span className="text-lg font-bold text-red-600">
                          - {formatCurrency(calculations.totalFutureExpenses)}
                        </span>
                      </div>
                      
                      {/* Replace individual Financial Goals with Cumulative Financial Goal */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Cumulative Financial Goal</span>
                        <span className="text-lg font-bold text-red-600">
                          - {formatCurrency(calculations.totalFinancialGoals)}
                        </span>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-800">Total</span>
                          <span className="text-xl font-bold text-red-600">
                            - {formatCurrency(calculations.totalExistingLiabilities + calculations.totalFutureExpenses + calculations.totalFinancialGoals)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle>Heading</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">All Existing Assets:</span>
                    <span className="font-semibold">{formatCurrency(calculations.totalExistingAssets)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">(Less) Existing Loans:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(calculations.totalExistingLiabilities)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Networth:</span>
                    <span className="font-semibold">{formatCurrency(calculations.currentNetworth)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">add: Future human Capital:</span>
                    <span className="font-semibold text-green-600">+{formatCurrency(calculations.totalHumanCapital)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">(Less) Future Expenditures:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(calculations.totalFutureExpenses)}</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-800">Surplus/Deficit:</span>
                      <span className={`text-xl font-bold ${calculations.surplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(calculations.surplusDeficit))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Section */}
            <Card className="mt-6 shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  <span>Graph Heading</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        label={{ value: 'Life Tenure', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Total Assets', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name]}
                        labelFormatter={(label) => `Year: ${label}`}
                      />
                      <Bar dataKey="income" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Enter your financial information to see projections</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <LifeSheetApp />
    </AuthProvider>
  )
}

export default App

