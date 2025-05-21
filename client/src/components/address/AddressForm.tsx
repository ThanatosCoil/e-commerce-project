import { useState, useEffect } from "react";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "@/store/api/addressSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { MaskedInput } from "@/components/ui/masked-input";
import { toast } from "sonner";

export interface AddressFormData {
  id?: string;
  name: string;
  address: string;
  country: string;
  city: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

interface AddressFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
  initialData?: AddressFormData;
  mode?: "create" | "edit";
  className?: string;
  compact?: boolean;
}

const AddressForm = ({
  onCancel,
  onSuccess,
  initialData,
  mode = "create",
  className = "",
  compact = false,
}: AddressFormProps) => {
  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();

  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    address: "",
    country: "",
    city: "",
    zipCode: "",
    phone: "",
    isDefault: false,
  });

  // Состояние для ошибок формы
  const [formErrors, setFormErrors] = useState<{
    phone?: string;
    zipCode?: string;
  }>({});

  // Загружаем начальные данные
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Специальная обработка для ZIP-кода - только цифры
    if (name === "zipCode") {
      // Пропускаем только цифры
      const onlyDigits = value.replace(/[^\d]/g, "");
      setFormData({
        ...formData,
        [name]: onlyDigits,
      });

      // Сбрасываем ошибку если есть
      if (formErrors.zipCode) {
        setFormErrors({
          ...formErrors,
          zipCode: undefined,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Обработчик потери фокуса для поля телефона
  const handleBlurPhone = () => {
    // Если в поле только маска, то очищаем
    if (formData.phone === "+" || /^\+[_\s()-]*$/.test(formData.phone)) {
      setFormData({
        ...formData,
        phone: "",
      });
      return;
    }

    // Проверка заполненности номера телефона только если поле не пустое
    if (formData.phone.trim() !== "") {
      const digitsCount = formData.phone.replace(/[^0-9]/g, "").length;
      if (digitsCount < 11) {
        setFormErrors({
          ...formErrors,
          phone: "Please enter a complete phone number",
        });
      } else {
        setFormErrors({
          ...formErrors,
          phone: undefined,
        });
      }
    } else {
      // Для пустого поля - убираем ошибку, если она была
      setFormErrors({
        ...formErrors,
        phone: undefined,
      });
    }
  };

  // Обработчик изменений в поле телефона с маской
  const handlePhoneChange = (value: string) => {
    // Если пользователь начал вводить цифру без +, добавим его автоматически
    if (value && value.length === 1 && /^\d$/.test(value)) {
      value = "+" + value;
    }

    setFormData({
      ...formData,
      phone: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка телефона на полноту заполнения
    const phoneDigits = formData.phone.replace(/[^0-9]/g, "").length;
    const hasErrors: { [key: string]: string } = {};

    // Проверяем только если поле не пустое
    if (formData.phone.trim() !== "" && phoneDigits < 11) {
      hasErrors["phone"] = "Please enter a complete phone number";
    }

    // Если есть ошибки, прерываем отправку формы
    if (Object.keys(hasErrors).length > 0) {
      setFormErrors(hasErrors);
      toast.error("Please correct the errors in the form");
      return;
    }

    try {
      // Обработка номера телефона - удаляем форматирующие символы, оставляем только + и цифры
      const processedPhone = formData.phone.replace(/[^+\d]/g, "");
      const dataToSubmit = {
        ...formData,
        phone: processedPhone,
      };

      if (mode === "create") {
        await createAddress(dataToSubmit).unwrap();
        toast.success("Address added successfully");
      } else if (mode === "edit" && formData.id) {
        await updateAddress({ ...dataToSubmit, id: formData.id }).unwrap();
        toast.success("Address updated successfully");
      }

      // Очистить форму и вызвать колбэк успеха
      setFormData({
        name: "",
        address: "",
        country: "",
        city: "",
        zipCode: "",
        phone: "",
        isDefault: false,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("An error occurred while saving the address");
      console.error(error);
    }
  };

  const isLoading = isCreating || isUpdating;
  const formBgClasses = compact
    ? "border border-gray-200 dark:border-gray-700 p-4 rounded-md bg-gray-50 dark:bg-gray-800/30 mt-4"
    : "p-6 bg-slate-50 shadow-sm dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700";

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={formBgClasses}>
        {!compact && (
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            {mode === "create" ? "New Address" : "Edit Address"}
          </h3>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Home, Work"
              required
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Phone Number
            </Label>
            <MaskedInput
              id="phone"
              name="phone"
              value={formData.phone}
              unmask={false}
              mask="+{0} (000) 000-00-00"
              lazy={true}
              definitions={{
                "0": /[0-9]/,
              }}
              onAccept={(value: string) => handlePhoneChange(value)}
              onBlur={handleBlurPhone}
              placeholder="+1 (234) 567-89-00"
              required
              className={`border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-gray-900 dark:text-gray-100 ${
                formErrors.phone
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {formErrors.phone && (
              <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <Label
            htmlFor="address"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Street Address
          </Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Street, House/Apartment"
            required
            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label
              htmlFor="country"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Country
            </Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="United States"
              required
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="city"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              City
            </Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="New York"
              required
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="zipCode"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              ZIP Code
            </Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="10001"
              required
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-gray-900 dark:text-gray-100"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-6">
          <Checkbox
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                isDefault: checked as boolean,
              })
            }
          />
          <Label
            htmlFor="isDefault"
            className="text-gray-700 dark:text-gray-300 font-normal"
          >
            Set as default address
          </Label>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Add Address" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AddressForm;
