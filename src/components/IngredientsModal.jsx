import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
} from "@material-tailwind/react";

export default function IngredientsModal({ open, handleOpen, ingredients }) {
  return (
    <Dialog open={open} handler={handleOpen} size="xl">
      <DialogHeader>Ingredients</DialogHeader>
      <DialogBody divider className="overflow-y-auto max-h-[70vh]">
        {ingredients && ingredients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border-b">#</th>
                  <th className="p-3 border-b">Material Name</th>
                  <th className="p-3 border-b">Manufacturer</th>
                  <th className="p-3 border-b">Size</th>
                  <th className="p-3 border-b">Unit Type</th>
                  <th className="p-3 border-b">Quantity</th>
                  <th className="p-3 border-b">Waste</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing, index) => (
                  <tr key={ing._id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{index + 1}</td>
                    <td className="p-3 border-b">{ing.material?.name || "-"}</td>
                    <td className="p-3 border-b">{ing.material?.manufacturer || "-"}</td>
                    <td className="p-3 border-b">{ing.material?.size || "-"}</td>
                    <td className="p-3 border-b">{ing.material?.unitType || "-"}</td>
                    <td className="p-3 border-b">{ing.quantity}</td>
                    <td className="p-3 border-b">{ing.waste}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Typography>No ingredients available.</Typography>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="outlined" color="red" onClick={handleOpen}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
