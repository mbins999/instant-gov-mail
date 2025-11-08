import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTemplates } from '@/hooks/useTemplates';
import { FileText, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TemplateSelectorProps {
  type: 'incoming' | 'outgoing' | 'all';
  onApply: (data: { greeting: string; subject: string; content: string }) => void;
}

export function TemplateSelector({ type, onApply }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const { templates, loading, applyTemplate, incrementUsageCount } = useTemplates(category, type);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject_template?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApply = () => {
    if (!selectedTemplate) return;

    const result = applyTemplate(selectedTemplate, variableValues);
    onApply(result);
    incrementUsageCount(selectedTemplate.id);
    setOpen(false);
    setSelectedTemplateId(null);
    setVariableValues({});
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'official': return 'رسمي';
      case 'request': return 'طلب';
      case 'response': return 'رد';
      case 'general': return 'عام';
      default: return cat;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          استخدام قالب
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>اختيار قالب مراسلة</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* القسم الأيسر: قائمة القوالب */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="official">رسمي</SelectItem>
                  <SelectItem value="request">طلب</SelectItem>
                  <SelectItem value="response">رد</SelectItem>
                  <SelectItem value="general">عام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في القوالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <ScrollArea className="h-[400px] border rounded-md">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  لا توجد قوالب
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                        selectedTemplateId === template.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        // تهيئة قيم المتغيرات
                        const initialValues: Record<string, string> = {};
                        template.variables.forEach(v => {
                          initialValues[v.name] = '';
                        });
                        setVariableValues(initialValues);
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        </div>
                        {template.subject_template && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {template.subject_template}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>استخدم {template.usage_count} مرة</span>
                          {template.is_public && <Badge variant="outline" className="text-xs">عام</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* القسم الأيمن: تفاصيل القالب والمتغيرات */}
          <div className="space-y-4">
            {selectedTemplate ? (
              <>
                <div className="space-y-2">
                  <Label>معاينة القالب</Label>
                  <div className="border rounded-md p-4 bg-muted/50">
                    <div className="space-y-2 text-sm">
                      <p><strong>التحية:</strong> {selectedTemplate.greeting}</p>
                      {selectedTemplate.subject_template && (
                        <p><strong>الموضوع:</strong> {selectedTemplate.subject_template}</p>
                      )}
                      <div>
                        <strong>المحتوى:</strong>
                        <pre className="mt-2 whitespace-pre-wrap text-xs">
                          {selectedTemplate.content_template}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4 pr-4">
                      <Label>املأ المتغيرات</Label>
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable.name} className="space-y-2">
                          <Label htmlFor={variable.name}>
                            {variable.description}
                          </Label>
                          {variable.type === 'textarea' ? (
                            <Textarea
                              id={variable.name}
                              value={variableValues[variable.name] || ''}
                              onChange={(e) =>
                                setVariableValues(prev => ({
                                  ...prev,
                                  [variable.name]: e.target.value
                                }))
                              }
                              rows={3}
                            />
                          ) : (
                            <Input
                              id={variable.name}
                              type={variable.type}
                              value={variableValues[variable.name] || ''}
                              onChange={(e) =>
                                setVariableValues(prev => ({
                                  ...prev,
                                  [variable.name]: e.target.value
                                }))
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <Button onClick={handleApply} className="w-full">
                  تطبيق القالب
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                اختر قالباً من القائمة
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
