import { FC } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { HelpCircle } from 'lucide-react';

export const RulesDialog: FC = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        aria-label="Show game rules"
        className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <HelpCircle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>OMI Game Rules</DialogTitle>
      </DialogHeader>
      <DialogDescription className="space-y-2 max-h-60 overflow-y-auto text-sm text-gray-700 dark:text-gray-300">
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
      <DialogClose className="mt-4 w-full bg-primary hover:bg-primary/90 text-white py-2 rounded">Close</DialogClose>
    </DialogContent>
  </Dialog>
);
