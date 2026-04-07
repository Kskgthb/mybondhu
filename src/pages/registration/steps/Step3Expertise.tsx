import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { BondhuRegistrationData } from '@/types/types';
import { categories } from '@/lib/categories';

interface Step3ExpertiseProps {
  data: BondhuRegistrationData['step3'];
  onChange: (data: Partial<BondhuRegistrationData['step3']>) => void;
}

export default function Step3Expertise({ data, onChange }: Step3ExpertiseProps) {
  const toggleCategory = (categoryId: string) => {
    const isSelected = data.expertise_categories.includes(categoryId);
    const newCategories = isSelected
      ? data.expertise_categories.filter((id) => id !== categoryId)
      : [...data.expertise_categories, categoryId];

    onChange({ expertise_categories: newCategories });
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="space-y-2">
        <Label>
          Select Your Expertise <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Choose one or more categories where you can help others
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => {
            const isSelected = data.expertise_categories.includes(category.value);
            const Icon = category.icon;

            return (
              <Card
                key={category.value}
                className={`relative cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => toggleCategory(category.value)}
              >
                <div className="p-4 flex flex-col items-center text-center gap-2">
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}
                  <Icon className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                    {category.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {data.expertise_categories.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {data.expertise_categories.length} {data.expertise_categories.length === 1 ? 'category' : 'categories'} selected
          </p>
        )}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-success/10 border-success/20">
        <p className="text-sm text-success-foreground">
          💡 <strong>Tip:</strong> Select all categories where you can provide assistance. You can always update this later!
        </p>
      </Card>
    </div>
  );
}
