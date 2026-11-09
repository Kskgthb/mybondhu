/**
 * Task Completion Workflow Component
 * Enforces proper task completion flow: CODE → Payment → Complete
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, Clock, CreditCard, Shield, Image as ImageIcon } from 'lucide-react';
import CompletionCodeInput from './CompletionCodeInput';
import TaskCompletionProofUpload from './TaskCompletionProofUpload';
import PaymentQRCode from '../payment/PaymentQRCode';
import { toast } from 'sonner';
import { tasksApi, assignmentsApi } from '@/db/api';
import { generateUPIQRData } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskWithAssignment } from '@/types/types';

interface TaskCompletionWorkflowProps {
  task: TaskWithAssignment;
  onComplete: () => void;
  onPaymentConfirm: () => void;
}

export default function TaskCompletionWorkflow({
  task,
  onComplete,
  onPaymentConfirm,
}: TaskCompletionWorkflowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'code' | 'proof' | 'payment' | 'complete'>(
    task.code_verified 
      ? (task.assignment?.proof_url 
          ? (task.payment_verified ? 'complete' : 'payment')
          : 'proof')
      : 'code'
  );
  const [proofUploaded, setProofUploaded] = useState(!!task.assignment?.proof_url);
  const [localCodeVerified, setLocalCodeVerified] = useState(false);
  const [isCashPayment, setIsCashPayment] = useState(task.payment_method === 'cash');

  // Generate QR data if missing (fallback)
  const paymentQRData = useMemo(() => {
    if (task.payment_qr_data) {
      return task.payment_qr_data;
    }
    
    // Generate on the fly if missing
    if (task.payment_method === 'online') {
      console.log('⚠️ Generating QR data on the fly (missing from database)');
      return generateUPIQRData(
        task.amount,
        'bondhuapp@upi',
        'Bondhu App',
        `Payment for: ${task.title}`
      );
    }
    
    return '';
  }, [task.payment_qr_data, task.payment_method, task.amount, task.title]);

  // Debug: Log task data
  console.log('🔄 TaskCompletionWorkflow - Task data:', {
    id: task.id,
    payment_method: task.payment_method,
    payment_qr_data: task.payment_qr_data,
    generated_qr_data: paymentQRData,
    code_verified: task.code_verified,
    payment_verified: task.payment_verified,
    proof_url: task.assignment?.proof_url,
    currentStep,
  });

  const handleCodeVerified = async (code: string) => {
    try {
      const result = await tasksApi.completeTaskWithCode(task.id, code);
      
      if (!result.success) {
        toast.error(result.message || 'Invalid completion code');
        throw new Error(result.message);
      }

      toast.success(result.message || 'Code verified successfully!');
      setLocalCodeVerified(true);
      
      // Always move to proof step next
      setCurrentStep('proof');

      if (task.payment_method === 'cash') {
        setIsCashPayment(true);
      }
      
      onComplete(); // Reload task data, but it won't redirect yet because status is still in_progress
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error; // Re-throw to let CompletionCodeInput handle it
    }
  };

  const handleProofUploaded = async (proofUrl: string) => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Update proof_url in task_assignments
      await assignmentsApi.updateCompletionProof(task.id, user.id, proofUrl);
      
      toast.success('Proof uploaded successfully!');
      setProofUploaded(true);
      
      if (isCashPayment || task.payment_method === 'cash') {
        // Complete the cash task after proof
        const completeResult = await tasksApi.completeCashTaskAfterProof(task.id);
        if (!completeResult.success) {
          toast.error(completeResult.message || 'Failed to complete task');
          return;
        }
        setCurrentStep('complete');
        onComplete(); // Trigger reload and redirect now
      } else {
        setCurrentStep('payment');
        onComplete(); // Refresh task data
      }
    } catch (error) {
      console.error('Error updating proof:', error);
      toast.error('Failed to save proof. Please try again.');
    }
  };

  const handleSkipProof = () => {
    if (isCashPayment || task.payment_method === 'cash') {
      toast.error('Proof upload is mandatory for cash tasks to verify completion.');
      return;
    }
    toast.info('Skipped proof upload. You can upload later if needed.');
    setCurrentStep('payment');
  };

  const handlePaymentConfirmed = () => {
    setCurrentStep('complete');
    onPaymentConfirm();
  };

  const steps = [
    {
      id: 'code',
      title: 'Verify Completion Code',
      description: 'Enter the 6-digit code from task poster',
      icon: Shield,
      status: task.code_verified || localCodeVerified ? 'completed' : currentStep === 'code' ? 'active' : 'pending',
    },
    {
      id: 'proof',
      title: 'Upload Completion Proof',
      description: 'Upload photo showing completed task',
      icon: ImageIcon,
      status: proofUploaded ? 'completed' : currentStep === 'proof' ? 'active' : 'pending',
    },
    {
      id: 'payment',
      title: 'Process Payment',
      description: task.payment_method === 'cash' ? 'Cash payment (auto-verified)' : 'Complete online payment',
      icon: CreditCard,
      status: task.payment_verified ? 'completed' : currentStep === 'payment' ? 'active' : 'pending',
    },
    {
      id: 'complete',
      title: 'Task Completed',
      description: 'Task successfully completed',
      icon: CheckCircle2,
      status: task.status === 'completed' ? 'completed' : 'pending',
    },
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'active':
        return <Clock className="h-6 w-6 text-primary animate-pulse" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStepBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success">Completed</Badge>;
      case 'active':
        return <Badge className="bg-secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Steps</CardTitle>
        <CardDescription>
          Follow these steps to complete the task properly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Indicators */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {getStepIcon(step.status)}
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-12 mt-2 ${
                      step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{step.title}</h3>
                    {getStepBadge(step.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {/* Step Content */}
                  {step.id === 'code' && step.status === 'active' && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <CompletionCodeInput
                        taskId={task.id}
                        taskTitle={task.title}
                        onComplete={handleCodeVerified}
                      />
                    </div>
                  )}

                  {step.id === 'proof' && (step.status === 'active' || step.status === 'completed') && (
                    <div className="mt-4">
                      <TaskCompletionProofUpload
                        taskId={task.id}
                        taskTitle={task.title}
                        existingProofUrl={task.assignment?.proof_url}
                        onUploadComplete={handleProofUploaded}
                        onSkip={handleSkipProof}
                        allowReplace={!task.payment_verified}
                      />
                    </div>
                  )}

                  {step.id === 'payment' && step.status === 'active' && (
                    <div className="mt-4 space-y-4">
                      {task.payment_method === 'cash' ? (
                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <CheckCircle2 className="h-5 w-5" />
                            <p className="font-medium">Cash Payment - Auto Verified</p>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                            Cash payment will be handled offline. Task is automatically completed after code verification.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                              ⚡ Online Payment Required
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              Please scan the QR code below to complete payment. After payment, click "Confirm Payment Received" to complete the task.
                            </p>
                          </div>
                          
                          <PaymentQRCode
                            amount={task.amount}
                            taskId={task.id}
                            paymentStatus={task.payment_status}
                            qrData={paymentQRData}
                            taskTitle={task.title}
                          />

                          <Button
                            onClick={handlePaymentConfirmed}
                            className="w-full"
                            size="lg"
                          >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Confirm Payment Received
                          </Button>

                          <p className="text-xs text-muted-foreground text-center">
                            Only click after you have received the payment
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 'complete' && step.status === 'completed' && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-medium">Task Successfully Completed! 🎉</p>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Great job! The task has been completed and payment has been processed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Instructions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Important Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Complete each step in order</li>
            <li>Verify the completion code with the task poster</li>
            <li>Upload clear proof of completed task</li>
            <li>Ensure payment is received before confirming</li>
            <li>Do not skip any steps</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
