
import React from 'react';
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";

interface ProfileFormSubmitterProps {
  isLoading: boolean;
}

const ProfileFormSubmitter = ({ isLoading }: ProfileFormSubmitterProps) => {
  return (
    <div className="flex justify-end gap-2">
      <DialogClose asChild>
        <Button type="button" variant="outline">Cancel</Button>
      </DialogClose>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

export default ProfileFormSubmitter;
