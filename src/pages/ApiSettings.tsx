import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { correspondenceApi } from "@/services/correspondenceApi";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Server } from "lucide-react";

const ApiSettings = () => {
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const config = correspondenceApi.getConfig();
    if (config) {
      setBaseUrl(config.baseUrl);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await correspondenceApi.login(baseUrl, username, password);
      setIsAuthenticated(true);
      
      toast({
        title: "تم الاتصال بنجاح",
        description: "تم الاتصال بنظام المراسلات الخارجي",
      });

      // Clear password
      setPassword("");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بنظام المراسلات. تحقق من البيانات والمحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    correspondenceApi.logout();
    setIsAuthenticated(false);
    setPassword("");
    
    toast({
      title: "تم قطع الاتصال",
      description: "تم قطع الاتصال بنظام المراسلات الخارجي",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">إعدادات الربط مع النظام الخارجي</h1>
        <p className="text-muted-foreground">قم بإعداد الاتصال مع نظام المراسلات الخارجي</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle>إعدادات الاتصال</CardTitle>
            </div>
            <CardDescription>
              أدخل بيانات الاتصال بنظام المراسلات الخارجي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">عنوان API الأساسي</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  required
                  disabled={isAuthenticated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  required
                  disabled={isAuthenticated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isAuthenticated}
                />
              </div>

              {!isAuthenticated ? (
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Lock className="ml-2 h-4 w-4" />
                  {isLoading ? "جاري الاتصال..." : "الاتصال بالنظام"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  قطع الاتصال
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حالة الاتصال</CardTitle>
            <CardDescription>معلومات عن حالة الاتصال الحالية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">الحالة:</span>
              <span className={`font-bold ${isAuthenticated ? 'text-success' : 'text-destructive'}`}>
                {isAuthenticated ? "متصل" : "غير متصل"}
              </span>
            </div>

            {isAuthenticated && (
              <>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">عنوان API:</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {baseUrl}
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <Link to="/new">
                    <Button className="w-full">
                      إنشاء مراسلة جديدة
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">الخدمات المتاحة:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• إرسال المراسلات</li>
                <li>• استقبال المراسلات</li>
                <li>• إدارة المرفقات</li>
                <li>• تتبع حالة المراسلات</li>
                <li>• سجل الإجراءات</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiSettings;
