import { FC, ReactNode } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { HelpCircle } from 'lucide-react';

interface RulesDialogProps {
  children?: ReactNode;
}

export const RulesDialog: FC<RulesDialogProps> = ({ children }) => (
  <Dialog>
    <DialogTrigger asChild>
      {children || (
        <button
          aria-label="Show game rules"
          className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <HelpCircle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </DialogTrigger>
    <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <DialogHeader>
        <DialogTitle className="text-black dark:text-white">OMI Game Rules</DialogTitle>
      </DialogHeader>
      <DialogDescription className="space-y-2 max-h-60 overflow-y-auto text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-black dark:text-white">
        <p>OMI is a Sri Lankan trick-taking card game for four players in teams of two.</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Each round starts with bidding phases: Half Quote, Trump Declaration, and Full Quote.</li>
          <li>Players decide if they commit to winning all 8 tricks (Half/Full Quote) for extra points.</li>
          <li>Trump suit gives those cards higher rank during trick play.</li>
          <li>Players then exchange cards with their teammate if Full Quote is declared.</li>
          <li>During trick play, players must follow suit if possible.</li>
          <li>The team that wins more tricks scores points; quotes can multiply scores.</li>
          <li>First team to reach a set target wins the game.</li>
        </ol>
      </DialogDescription>
      <div className="mt-4">
        <DialogClose className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-2 rounded font-medium shadow-md border-2 border-blue-700 dark:border-blue-600">
          Close
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>
);
