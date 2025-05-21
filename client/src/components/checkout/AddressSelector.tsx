import { useState } from "react";
import { Address } from "@/store/api/addressSlice";
import AddressForm from "@/components/address/AddressForm";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelectAddress: (addressId: string) => void;
}

const AddressSelector = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: AddressSelectorProps) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border p-3 rounded-md cursor-pointer transition-colors duration-200 ${
                selectedAddressId === address.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30"
              }`}
              onClick={() => onSelectAddress(address.id)}
            >
              <div className="flex justify-between">
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {address.name}
                </div>
                {address.isDefault && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {address.address}, {address.city}, {address.country}{" "}
                {address.zipCode}
              </div>
              <div className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                {address.phone}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mb-4">
          No addresses found. Please add one below.
        </p>
      )}

      {showAddForm ? (
        <AddressForm
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => setShowAddForm(false)}
          compact={true}
        />
      ) : (
        <button
          className="mt-4 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors font-medium"
          onClick={() => setShowAddForm(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add new address
        </button>
      )}
    </div>
  );
};

export default AddressSelector;
